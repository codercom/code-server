#!/usr/bin/env bash
set -euo pipefail

main() {
  cd "$(dirname "$0")/../.."
  source ./ci/lib.sh

  pushd test
  echo "Installing dependencies for $PWD"
  yarn
  popd

  pushd test/e2e/extensions/test-extension
  echo "Installing dependencies for $PWD"
  yarn
  popd

  pushd lib/vscode
  echo "Installing dependencies for $PWD"
  yarn ${CI+--frozen-lockfile}
  symlink_asar
  popd
}

main "$@"
