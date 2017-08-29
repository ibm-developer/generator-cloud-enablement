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

/* eslint-env mocha */

'use strict';

const helpers = require('yeoman-test');
const assert = require('yeoman-assert');
const path = require('path');

const scaffolderSample = require('./samples/scaffolder-sample');
const scaffolderSampleNode = scaffolderSample.getJson('NODE');
const scaffolderSampleSwift = scaffolderSample.getJson('SWIFT');
const scaffolderSampleJava = scaffolderSample.getJson('JAVA');
const scaffolderSampleSpring = scaffolderSample.getJson('SPRING');
const scaffolderSamplePython = scaffolderSample.getJson('PYTHON');

const applicationName = "AcmeProject"; // From all scaffolder samples

describe('cloud-enablement:dockertools', () => {

	before(function(){
		this.timeout(5000);
	});

	describe('cloud-enablement:dockertools with Swift project', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleSwift)});
		});

		it('create Dockerfile for running', () => {
			assert.file([
				'Dockerfile'
			]);
		});

		it('should have the executableName property set in Dockerfile', () => {
			assert.fileContent('Dockerfile', `CMD [ "sh", "-c", "cd /swift-project && .build-ubuntu/release/${applicationName}" ]`);
		});

		it('create Dockerfile-tools for compilation', () => {
			assert.file([
				'Dockerfile-tools'
			]);
		});

		it('create cli-config for CLI tool', () => {
			assert.file(['cli-config.yml']);
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
			assert.fileContent('cli-config.yml', 'run-cmd : ""');
		});

		it('create dockerignore file', () => {
			assert.file([
				'.dockerignore'
			]);
		});

		it('should have the chart-path property set in cli-config.yml', () => {
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
		});
	});

	describe('cloud-enablement:dockertools with NodeJS project', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleNode)})
		});

		it('create Dockerfile for running', () => {
			assert.file(['Dockerfile', 'cli-config.yml', 'Dockerfile-tools']);
		});

		it('has correct default port', () => {
			assert.fileContent('cli-config.yml', '3000:3000');
		});

		it('create dockerignore file', () => {
			assert.file([
				'.dockerignore'
			]);
		});

		it('should have the chart-path property set in cli-config.yml', () => {
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
		});
	});

	describe('cloud-enablement:dockertools with NodeJS project and storage', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleNode)})
		});

		it('create Dockerfile for running', () => {
			assert.file(['Dockerfile', 'cli-config.yml', 'Dockerfile-tools']);
		});

		it('has correct port', () => {
			assert.fileContent('cli-config.yml', '3000:3000');
		});

		it('create dockerignore file', () => {
			assert.file([
				'.dockerignore'
			]);
		});

		it('should have the chart-path property set in cli-config.yml', () => {
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
		});
	});

	let buildTypes = ['maven', 'gradle'];
	let languages = ['JAVA', 'SPRING'];
	buildTypes.forEach(buildType => {
		languages.forEach(language => {
			describe('cloud-enablement:dockertools with Java project with buildType ' + buildType + ' and language ' + language, () => {
				let bluemixJson = language === 'SPRING' ? scaffolderSampleSpring : scaffolderSampleJava;
				let options = {bluemix: JSON.stringify(bluemixJson), buildType: buildType};
				
				beforeEach(() => {
					return helpers.run(path.join(__dirname, '../generators/app'))
						.inDir(path.join(__dirname, './tmp'))
						.withOptions(options)
				});

				it('create Dockerfile for running', () => {
					assert.file('Dockerfile');
				});
				it('create dockerignore file', () => {
					assert.file('.dockerignore');
				});
				it('create Dockerfile-tools for compilation', () => {
					assert.file('Dockerfile-tools');
				});
				it('create cli-config for CLI tool', () => {
					assert.file('cli-config.yml');
				});
				it('create cli-config chart path includes application name', () => {
					assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
				});
			});
		})
	})

	/* Full Content test for Java (Spring) project */
	describe('cloud-enablement:dockertools with Java-Spring project with buildType maven with platforms including cli', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleSpring), platforms: ['cli'], buildType: 'maven'})
		});

		it('creates all docker and cli files', () => {
			assert.file(['Dockerfile', '.dockerignore', 'Dockerfile-tools', 'cli-config.yml']);
		});
		it('Dockerfile contains app.jar', () => {
			assert.fileContent('Dockerfile', '/app.jar');
		});
		it('.dockerignore does not contain wlp', () => {
			assert.noFileContent('.dockerignore', 'wlp');
		});
		it('Dockerfile-tools does not contain wlp', () => {
			assert.noFileContent('Dockerfile-tools', 'wlp/bin');
		});
	});

	/* Full Content test for Java (Liberty) project */
	describe('cloud-enablement:dockertools with Java-liberty project with buildType maven with platforms including cli', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleJava), platforms: ['cli'], buildType: 'maven'})
		});

		it('creates all docker and cli files', () => {
			assert.file(['Dockerfile', '.dockerignore', 'Dockerfile-tools', 'cli-config.yml']);
		});
		it('.dockerignore ignores workarea and logs', () => {
			assert.fileContent('.dockerignore', 'workarea');
			assert.fileContent('.dockerignore', 'logs');
		});
		it('Dockerfile contains installUtility', () => {
			assert.fileContent('Dockerfile', 'installUtility');
		});
		it('Dockerfile-tools contains wlp path', () => {
			assert.fileContent('Dockerfile-tools', 'wlp/bin');
		});
	});

	/* Verify CLI tag behavior */
	describe('cloud-enablement:dockertools with Java-liberty project with buildType maven with NO platforms', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleJava), platforms: [], buildType: 'maven'})
		});

		it('creates a Dockerfile and .dockerignore', () => {
			assert.file(['Dockerfile', '.dockerignore']);
		});

		it('does not create a Dockerfile-tools or cli-config.yml', () => {
			assert.noFile(['Dockerfile-tools', 'cli-config.yml']);
		});
	});


	describe('cloud-enablement:dockertools with Java-liberty project with buildType maven with javametrics enabled', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleJava), javametrics: true, buildType: 'maven', frameworkType: 'liberty'})
		});

		it('creates all docker with javametrics options', () => {
			assert.fileContent('Dockerfile','COPY /target/liberty/wlp/usr/shared/resources /config/resources/');
			assert.fileContent('Dockerfile','COPY /src/main/liberty/config/jvmbx.options /config/jvm.options');
		});
	});

	describe('cloud-enablement:dockertools with Java-liberty project with buildType maven with javametrics disabled', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSampleJava), javametrics: false, buildType: 'maven', frameworkType: 'liberty'})
		});

		it('creates all docker without javametrics options', () => {
			assert.noFileContent('Dockerfile','COPY /target/liberty/wlp/usr/shared/resources /config/resources/');
			assert.noFileContent('Dockerfile','COPY /src/main/liberty/config/jvmbx.options /config/jvm.options');
		});
	});

	describe('cloud-enablement:dockertools with Python project', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSamplePython)})
		});

		it('create Dockerfile with gunicorn', () => {
			assert.file(['Dockerfile']);
			assert.fileContent('Dockerfile', 'gunicorn');
		});

		it('create Dockerfile-tools with flask', () => {
			assert.file(['Dockerfile-tools']);
		})

		it('create CLI-config file', () => {
			assert.file(['cli-config.yml']);
			assert.fileContent('cli-config.yml', 'flask run');
			assert.fileContent('cli-config.yml', 'acmeproject-flask-run');
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
		});

		it('create dockerignore file', () => {
			assert.file([
				'.dockerignore'
			]);
		});
	});

	describe('cloud-enablement:dockertools with Python project and storage', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/app'))
				.inDir(path.join(__dirname, './tmp'))
				.withOptions({bluemix: JSON.stringify(scaffolderSamplePython)})
		});

		it('create Dockerfile with gunicorn', () => {
			assert.file(['Dockerfile']);
			assert.fileContent('Dockerfile', 'gunicorn');
		});

		it('create Dockerfile-tools with flask', () => {
			assert.file(['Dockerfile-tools']);
		})

		it('create CLI-config file', () => {
			assert.file(['cli-config.yml']);
			assert.fileContent('cli-config.yml', 'flask run');
			assert.fileContent('cli-config.yml', 'acmeproject-flask-run');
			assert.fileContent('cli-config.yml', `chart-path : "chart/${applicationName.toLowerCase()}"`);
		});

		it('create dockerignore file', () => {
			assert.file([
				'.dockerignore'
			]);
		});
	});

	describe('cloud-enablement:dockertools with empty bluemix object', () => {
		beforeEach(() => {
			return helpers.run(path.join(__dirname, '../generators/dockertools'))
				.withOptions({ bluemix: '{"backendPlatform":"NODE"}' })
		});
		it('should give us the default output with no project name', () => {
			assert.file('Dockerfile');
			assert.fileContent('cli-config.yml', 'container-name-run : "app-express-run"');
		});
	});
});
