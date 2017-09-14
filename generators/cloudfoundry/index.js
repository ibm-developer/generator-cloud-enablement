/*
 Copyright 2017 IBM Corp.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const Handlebars = require('handlebars');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.opts = opts.cloudContext || opts;
		if (typeof (opts.bluemix) === 'string') {
			this.bluemix = JSON.parse(opts.bluemix || '{}');
		} else if (typeof (opts.bluemix) === 'object') {
			this.bluemix = opts.bluemix;
		}
	}

	configuring() {
		this.manifestConfig = {};
		this.manifestConfig.env = {};
		this.toolchainConfig = {};
		this.pipelineConfig = {
			buildJobProps : {artifact_dir: "''"},
			services: this.bluemix.services
		};
		this.name = undefined
		if(this.bluemix.server) {
			this.name = this.bluemix.server.name;
			this.manifestConfig = Object.assign(this.manifestConfig, this.bluemix.server);
		} else {
			this.name = this.bluemix.name;
			this.manifestConfig.name = this.bluemix.name;
		}
		this.toolchainConfig.repoType = this.opts.repoType || "clone";
		switch (this.bluemix.backendPlatform) {
			case 'NODE':
				this._configureNode();
				break;
			case 'SWIFT':
				this._configureSwift();
				break;
			case 'JAVA':
				this._configureLiberty();
				this._configureJavaCommon();
				break;
			case 'SPRING':
				this._configureJavaCommon();
				this._configureSpring();
				break;
			case 'PYTHON':
				this._configurePython();
				break;
			default:
				throw new Error(`Language ${this.bluemix.backendPlatform} was not one of the valid languages: NODE, SWIFT, JAVA, SPRING or PYTHON`);
		}
		if (this.manifestConfig && this.manifestConfig.ignorePaths) {
			this.cfIgnoreContent = this.cfIgnoreContent.concat(this.manifestConfig.ignorePaths);
		}
	}

	_configureNode() {
		this.manifestConfig.buildpack = 'sdk-for-nodejs';
		this.manifestConfig.command = 'npm start';
		this.manifestConfig.memory = this.manifestConfig.memory || '256M';
		this.cfIgnoreContent = ['.git/', 'node_modules/', 'test/', 'vcap-local.js'];
	}

	_configureSwift() {
		this.manifestConfig.buildpack = 'swift_buildpack';
		this.manifestConfig.command = this.name ? (`${this.name}`) : undefined;
		this.manifestConfig.memory = this.manifestConfig.memory || '128M';
		this.cfIgnoreContent = ['.build/*', 'Packages/*'];
	}

	_configureJavaCommon() {
		if(this.opts.appName) {
			this.manifestConfig.name = this.opts.appName;
			this.name = this.opts.appName;
		}
		if (this.opts.createType === 'bff/liberty') {
			this.manifestConfig.env.OPENAPI_SPEC = `/${this.name}/swagger/api`;
		}
		if (this.opts.createType === 'bff/spring') {
			this.manifestConfig.env.OPENAPI_SPEC = '/swagger-ui.html';
		}
		
		if (this.opts.createType && this.opts.createType.startsWith('enable/')) {
			this.toolchainConfig.repoType = 'link';
		}
		this.pipelineConfig.triggersType = 'commit';
		let buildCommand = this.opts.buildType === 'maven' ? '      mvn install' : '      gradle build';
		this.pipelineConfig.buildJobProps = {
			build_type: 'shell',
			script: '|\n' +
			'      #!/bin/bash\n' +
			'      export JAVA_HOME=$JAVA8_HOME\n' +
			buildCommand
		};
	}

	_configureLiberty() {
		this.cfIgnoreContent = ['/.classpath', '/.project', '/.settings', '/src/main/liberty/config/server.env', 'target/', 'build/'];
		this.manifestConfig.buildpack = 'liberty-for-java';
		this.manifestConfig.memory = this.manifestConfig.memory || '512M';
		this.manifestConfig.path = (this.opts.buildType && this.opts.buildType === 'gradle') ? `./build/${this.name}.zip` : `./target/${this.name}.zip`;
		let excludes = [];
		if (this.bluemix.cloudant) {
			excludes.push('cloudantNoSQLDB=config');
		}
		if (this.bluemix.objectStorage) {
			excludes.push('Object-Storage=config');
		}
		if(excludes.length === 1) {
			this.manifestConfig.env.services_autoconfig_excludes = excludes[0];
		}
		if(excludes.length === 2) {
			this.manifestConfig.env.services_autoconfig_excludes = excludes[0] + ' ' + excludes[1];
		}
		let fileLocation = (this.opts.buildType && this.opts.buildType === 'gradle') ? `build/${this.name}.zip` : `target/${this.name}.zip`;
		this.pipelineConfig.pushCommand = 'cf push "${CF_APP}" -p ' + fileLocation;
	}

	_configureSpring() {
		this.cfIgnoreContent = ['/.classpath', '/.project', '/.settings', '/src/main/resources/application-local.properties', 'target/', 'build/'];
		this.manifestConfig.buildpack = 'java_buildpack';
		this.manifestConfig.memory = this.manifestConfig.memory || '256M';
		this.manifestConfig.path = (this.opts.buildType && this.opts.buildType === 'gradle') ? `./build/libs/${this.name}-${this.opts.version}.jar` : `./target/${this.name}-${this.opts.version}.jar`;
		let fileLocation = (this.opts.buildType && this.opts.buildType === 'gradle') ? `build/libs/${this.name}-${this.opts.version}.jar` : `target/${this.name}-${this.opts.version}.jar`;
		this.pipelineConfig.pushCommand = 'cf push "${CF_APP}" -p ' + fileLocation;
	}

	_configurePython() {
		// buildpack is left blank; bluemix will auto detect
		this.manifestConfig.buildpack = 'python_buildpack';
		this.manifestConfig.command = 'gunicorn server:app -b 0.0.0.0:$PORT';
		this.manifestConfig.memory = this.manifestConfig.memory || '128M';
		this.manifestConfig.env.FLASK_APP = 'server';
		this.manifestConfig.env.FLASK_DEBUG = 'true';
		this.cfIgnoreContent = ['.pyc', '.egg-info'];
	}

	cleanUpPass() {
		if (this.manifestConfig && this.manifestConfig.env && Object.keys(this.manifestConfig.env).length < 1) {
			delete this.manifestConfig.env;
		}
		if (this.cfIgnoreContent) {
			this.cfIgnoreContent = this.cfIgnoreContent.join('\n');
		}
	}

	writing() {
		//skip writing files if platforms is specified via options and it doesn't include bluemix
		if(this.opts.platforms && !this.opts.platforms.includes('bluemix')) {
			return;
		}
		// write manifest.yml file
		this._writeHandlebarsFile('manifest_master.yml', 'manifest.yml', this.manifestConfig)

		// if cfIgnnoreContent exists, create/write .cfignore file
		if (this.cfIgnoreContent) {
			this.fs.write('.cfignore', this.cfIgnoreContent);
		}

		// create .bluemix directory for toolchain/devops related files
		this._writeHandlebarsFile('toolchain_master.yml', '.bluemix/toolchain.yml', {name: this.name, repoType: this.toolchainConfig.repoType});

		this.fs.copy(
			this.templatePath('deploy_master.json'),
			this.destinationPath('.bluemix/deploy.json')
		);

		this._writeHandlebarsFile('pipeline_master.yml', '.bluemix/pipeline.yml', this.pipelineConfig);
	}

	_writeHandlebarsFile(templateFile, destinationFile, data) {
		let template = this.fs.read(this.templatePath(templateFile));
		let compiledTemplate = Handlebars.compile(template);
		let output = compiledTemplate(data);
		this.fs.write(this.destinationPath(destinationFile), output);
	}
};
