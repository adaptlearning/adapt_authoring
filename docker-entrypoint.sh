#!/bin/bash


file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"

	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
		exit 1
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	export "$var"="$val"
	unset "$fileVar"
}

load_vars() {
	file_env "DB_URI"
	file_env "ADMIN_PASSWORD"
	file_env "SESSION_KEY"
}

install_adapt() {
	echo "No 'conf' dir found, running 'node install...'"

	tenantname=`od -x /dev/urandom | head -1 | awk '{OFS=""; print $2$3,$4,$5,$6,$7$8$9}'`

	yes "" | node install --install Y \
   		--authoringToolRepository https://github.com/adaptlearning/adapt_authoring.git \
		--frameworkRepository https://github.com/adaptlearning/adapt_framework.git \
		--frameworkRevision tags/v5.22.9 \
		--serverPort "${PORT}" --serverName "${DOMAIN}" \
		--dbConnectionUri "${DB_URI}" \
		--dbName "${DB_NAME}" \
		--dataRoot data \
		--sessionSecret "${SESSION_KEY}" --useffmpeg Y \
		--masterTenantName instill --masterTenantDisplayName instill \
		--suEmail "${ADMIN_EMAIL}" --suPassword "${ADMIN_PASSWORD}" \
		--suRetypePassword "${ADMIN_PASSWORD}" 
}

main() {
	set -eu

	load_vars

	if [ ! -f conf/config.json ]; then
		install_adapt
	fi
}

main

exec "$@"