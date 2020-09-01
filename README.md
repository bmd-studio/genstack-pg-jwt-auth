# genstack-container-pg-jwt-auth
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/bmd-studio/genstack-container-pg-jwt-auth/test)

## Debugging
The `DEBUG` environment variable is used for debugging using the `pg-jwt-auth` namespace.

To enable info logs:
```
DEBUG=pg-to-mqtt:info
```

To enable errors:
```
DEBUG=pg-to-mqtt:error
```

To enable all:
```
DEBUG=pg-to-mqtt:*
```