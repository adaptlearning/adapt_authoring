#OS detect and setup
ifdef SystemRoot
   #RM = del /Q
   FixPath = $(subst /,\,$1)
   TESTDIRS = $(shell .\win_find.bat .\plugins)
   NODEENV = Set NODE_ENV=test
else
   ifeq ($(shell uname), Linux)
      RM = rm -f
      FixPath = $1
      NODEENV = @NODE_ENV=test
      TESTDIRS= $(shell find plugins -maxdepth 3 -name test -type d -exec find {} -maxdepth 1 -name "*.js" -o -name '*.coffee' \;)
   endif
endif

MOCHA_OPTS= 
REPORTER = dot

test: test-core test-plugins
#test: test-plugins

test-core:
	@echo "Running Core Tests:"
    
	$(NODEENV) && $(call FixPath,"./node_modules/.bin/mocha") \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-plugins:
ifneq ("$(TESTDIRS)", "")
	@echo "Running Plugin Tests:"
	$(NODEENV) && $(call FixPath,"./node_modules/.bin/mocha") \
		$(TESTDIRS) \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)
endif


.PHONY: test test-core test-plugins


#for /r %%F in (*) do (
#  echo %%~fF
#)  