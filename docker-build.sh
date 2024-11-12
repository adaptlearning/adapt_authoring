#!/bin/bash
ENV_VERSION=icms-authoring-tool-0.0.57
ECR=



function display_message {
  echo ""
  echo "<<==================================================================================>>"
  echo "$1"
  echo "<<==================================================================================>>"
}

display_message "Building the deploy image... " && \
${DRY_RUN} docker build --platform=linux/amd64  -t edugix/lms:${ENV_VERSION} . && \
display_message "Successfully build ${ENV_VERSION}  images"
display_message "Pushing the new ${ENV_VERSION}  images..." &&
${DRY_RUN} docker tag edugix/lms:${ENV_VERSION}  ${ECR}/lms:${ENV_VERSION}
${DRY_RUN} docker login -u AWS -p $(aws ecr get-login-password --profile lms --region ap-southeast-1) ${ECR} && \
${DRY_RUN} docker push ${ECR}/lms:${ENV_VERSION} && \
display_message "Successfully push docker ${ENV_VERSION}  images"
