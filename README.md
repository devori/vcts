# Virtual Currency Trading System (VCTS)

## API
### Public
##### GET /api/v1/public/markets/:market/tickers/:base?/:vcType?
* Request
  * Path parameter
    * market : Market name
    * base : Base currency name
    * vcType : Target currency name
* Response
  * Body
    <pre>
    ...
    </pre>

##### POST /api/v1/public/accounts
* Request
  * Body
    <pre>
    {
      "name": USERNAME
    }
    </pre>
* Response
  * Body
    <pre>
    {
      "apiKey": API_KEY,
      "secretKey": SECRET_KEY,
      "name": USERNAME
    }
    </pre>

### Private
#### Header (required)
  <pre>
  api-key: API_KEY
  sign: SIGN_VALUE
  nonce: NUMBER
  </pre>
##### GET  /api/v1/private/markets/:market/assets/:base?/:vcType?
* Request
  * Path parameter
    * market : Market name
    * base : Base currency name
    * vcType : Target currency name
* Response
##### POST /api/v1/private/markets/:market/assets/:base/:vcType
* Request
  * Path parameter
    * market : Market name
    * base : Base currency name
    * vcType : Target currency name
* Response
##### DELETE /api/v1/private/markets/:market/assets/:base/:vcType
* Request
  * Path parameter
    * market : Market name
    * base : Base currency name
    * vcType : Target currency name
* Response
##### GET /api/v1/private/markets/:market/histories/:base?/:vcType?
* Request
  * Path parameter
    * market : Market name
    * base : Base currency name
    * vcType : Target currency name
* Response
