SRC =$(wildcard src/*.js)

build: $(SRC) VERSION
	@jsmerge
	@echo \/\/version:`cat VERSION` > build/build.min.js
	@./node_modules/.bin/uglifyjs build/build.js >> build/build.min.js

components: component.json
	@component install --dev

start:
	@node-dev app.js

clean:
	rm -fr build components

.PHONY: clean start upgrade
