MOCHA_OPTS= --check-leaks
REPORTER = dot
TESTDIRS= $(shell find plugins -maxdepth 3 -name test -type d -exec find {} -maxdepth 1 -name "*.js" -o -name '*.coffee' \;)

test: test-core test-plugins

test-core:
	@echo "Running Core Tests:"
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-plugins:
ifneq ("$(TESTDIRS)", "")
	@echo "Running Plugin Tests:"
	@NODE_ENV=test ./node_modules/.bin/mocha \
		$(TESTDIRS) \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)
endif


.PHONY: test test-core test-plugins
