{ lib', pkgs, self' }: {
  default = pkgs.mkShell {
    packages = pkgs.lib.flatten [
      lib'.env.dependencies
      (pkgs.lib.attrValues self'.packages)
    ];
    shellHook = ''
      source nodejs-env-luffi
    '';
  };
}
