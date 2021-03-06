FROM python:3.6-alpine

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN apk --update add python py-pip openssl ca-certificates py-openssl wget bash linux-headers
RUN apk --update add --virtual build-dependencies libffi-dev openssl-dev python-dev py-pip build-base \
{{#each servicesPackages}}
  {{this}} \
{{/each}}
  && pip install --upgrade pip \
  && pip install --upgrade pipenv\
  && pip install --upgrade -r /tmp/requirements.txt\
  && apk del build-dependencies

COPY . /app
{{#unless enable}}
{{#ifCond language "===" "PYTHON"}}
ENV FLASK_APP=server/__init__.py
{{/ifCond}}
{{/unless}}
{{#if enable}}
CMD ["echo", "No run command specified in Dockerfile"]
{{else}}
{{#ifCond language "===" "PYTHON"}}
CMD ["python", "manage.py", "start", "0.0.0.0:{{port}}"]
{{else}}
CMD ["gunicorn", "-b", "0.0.0.0:3000", "--env", "DJANGO_SETTINGS_MODULE={{name}}.settings.production", "{{name}}.wsgi", "--timeout 120"]
{{/ifCond}}
{{/if}}
