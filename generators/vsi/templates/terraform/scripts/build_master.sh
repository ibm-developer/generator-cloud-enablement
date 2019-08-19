#! /usr/bin/env bash

{{#has deployment.language 'NODE'}}
npm install
{{/has}}
{{#has deployment.language 'PYTHON'}}
tar -zcvf {{deployment.name}}.tgz Pipfile requirements.txt manage.py setup.py public server
mv setup.py setup.py.OLD
{{/has}}
{{#has deployment.language 'DJANGO'}}
pip install -r requirements.txt
{{/has}}
{{#has deployment.language 'SWIFT'}}
# Fix for Debian 9 (need to match the version of openssl)
# https://stackoverflow.com/questions/51560964/how-to-upgrade-openssl-from-1-0-2g-to-1-1-0g-in-ubuntu-and-let-python-recognize/51565653#51565653
wget https://www.openssl.org/source/old/1.1.0/openssl-1.1.0g.tar.gz
tar xzvf openssl-1.1.0g.tar.gz
cd openssl-1.1.0g
./config
make
sudo make install
openssl version -a
swift build -c release
{{/has}}
{{#has deployment.language 'SPRING'}}
mvn clean install
{{/has}}
{{#has deployment.language 'JAVA'}}
mvn clean install
target/liberty/wlp/bin/server package defaultServer --archive="{{deployment.name}}" --include=minify
{{/has}}
{{#has deployment.language 'GO'}}
project_name="$(cat manifest.yml | grep -w "GOPACKAGENAME :" | sed 's/    GOPACKAGENAME : //')"
original_folder_name="$(echo $(pwd) | sed 's/\/home\/pipeline\///')"
cd /home/pipeline
mkdir /go/src/$project_name
cp -r /home/pipeline/$original_folder_name /go/src
cd /go/src/
mv $original_folder_name $project_name
cd $project_name
mv  -v $original_folder_name/* /go/src/$project_name/ 
go get -u github.com/golang/dep/cmd/dep; dep init; dep ensure
go install
mv /go/bin/$project_name /home/pipeline/$original_folder_name
cd /home/pipeline/$original_folder_name
mv $project_name go_executable
{{/has}}
