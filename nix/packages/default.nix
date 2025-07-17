{ lib', pkgs }: {
  luffi-build = pkgs.callPackage ./luffi-build { inherit lib'; };
  luffi-lint = pkgs.callPackage ./luffi-lint { inherit lib'; };
}
