{
  description = "Universal FFI for server-side JavaScript";

  inputs = {
    dream2nix.url =
      "github:nix-community/dream2nix/8ce6284ff58208ed8961681276f82c2f8f978ef4?shallow=1";
    flake-parts.url =
      "github:hercules-ci/flake-parts/f4330d22f1c5d2ba72d3d22df5597d123fdb60a9?shallow=1";
    nixpkgs.url =
      "github:nixos/nixpkgs/ab472a7a8fcfd7c778729e7d7c8c3a9586a7cded?shallow=1";
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      systems =
        [ "aarch64-darwin" "aarch64-linux" "x86_64-darwin" "x86_64-linux" ];

      perSystem = { inputs', pkgs, self', system, ... }:
        let
          makeNodejsEnv = { name, overrides ? { }, pkgs, workspaceRoot }:
            let
              packageLockFile = workspaceRoot + "/package-lock.json";
              nodeModules = inputs.dream2nix.lib.evalModules {
                modules = [{
                  inherit name;
                  inherit ((builtins.fromJSON
                    (builtins.readFile packageLockFile)))
                    version;
                  imports = [
                    inputs.dream2nix.modules.dream2nix.nodejs-node-modules-v3
                  ];
                  nodejs-granular-v3.overrides = overrides;
                  nodejs-package-lock-v3.packageLockFile = packageLockFile;
                }];
                packageSets.nixpkgs = pkgs;
              };
              workspaceRootPath = pkgs.lib.lists.last
                (builtins.split "/nix/store/[^/]+/?" (toString workspaceRoot));
            in pkgs.writeShellApplication {
              bashOptions = [ ];
              name = "nodejs-env-${name}";
              runtimeInputs = [ pkgs.git pkgs.rsync ];
              text = ''
                REPO_ROOT=$(git rev-parse --show-toplevel)
                NODE_MODULES_SRC="${nodeModules}/lib/node_modules/${name}/node_modules"
                NODE_MODULES_DST="$REPO_ROOT/${workspaceRootPath}/node_modules"

                echo "[INFO] Syncing $NODE_MODULES_SRC to $NODE_MODULES_DST"
                rsync -a --no-perms --delete "$NODE_MODULES_SRC/" "$NODE_MODULES_DST/"
                chmod -R +w "$NODE_MODULES_DST"
              '';
            };
          lib' = {
            env = import ./nix/environment.nix { inherit makeNodejsEnv pkgs; };

            inherit makeNodejsEnv;
          };
        in {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };

          devShells = import ./nix/shell.nix { inherit lib' pkgs self'; };
          packages = import ./nix/packages { inherit lib' pkgs; };
        };
    };
}
