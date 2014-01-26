SRC =$(wildcard src/*.js)

build: $(SRC)
	@jsmerge
	@uglifyjs build/build.js > build/build.min.js

components: component.json
	@component install --dev

start:
	@node-dev app.js

clean:
	rm -fr build components

.PHONY: clean start upgrade
