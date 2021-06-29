#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  pushd test/e2e/extensions/test-extension
  echo "Building test extension"
  yarn build
  popd

  pushd test
  echo "Running e2e tests"
  yarn playwright test "$@"
  popd
}

main "$@"
