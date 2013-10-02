MOCHA_OPTS= --check-leaks
REPORTER = dot
TESTDIRS= $(shell find plugins -name test -type d -exec find {} -maxdepth 1 -name "*.js" -o -name '*.coffee' \;)

test: test-core test-plugins

test-core:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-plugins:
	@echo "Plugins :: "
	@NODE_ENV=test ./node_modules/.bin/mocha \
		$(TESTDIRS) \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)
		

.PHONY: test test-core test-plugins