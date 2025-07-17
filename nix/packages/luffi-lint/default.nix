{ pkgs, lib' }:
pkgs.writeShellApplication {
  name = "luffi-lint";
  runtimeInputs = lib'.env.dependencies;
  text = ''
    # shellcheck disable=SC1091
    source nodejs-env-luffi

    npm run lint
  '';
}
