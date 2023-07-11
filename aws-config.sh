#!/bin/bash

set -x

{
    AWS_CONFIG_FILE=~/.aws/credentials

    mkdir ~/.aws
    touch $AWS_CONFIG_FILE
    chmod 600 $AWS_CONFIG_FILE

    echo "[instill-account]"                              > $AWS_CONFIG_FILE
    echo "aws_access_key_id=${AWS_ACCESS_KEY_ID}"         >> $AWS_CONFIG_FILE
    echo "aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}" >> $AWS_CONFIG_FILE

    echo "[instill-sovtech]" >> $AWS_CONFIG_FILE
    echo "role_arn=$ROLE_ARN" >> $AWS_CONFIG_FILE
    echo "source_profile=instill-account" >> $AWS_CONFIG_FILE
} &> /dev/null