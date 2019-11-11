require("dotenv").config();
const fetch = require("node-fetch");

class OCCS {
  constructor() {
    // token
    this.token = null;
    // product info
    //this.orderId = null;
    this.productId = "iPhoneX"; // vision5
    this.catRefId = "iphoneXsg256GB"; // vision5 sku
    this.vision5Price = 999.0;
    this.quantity = 1;
    // customer data
    this.companyId = null;
    this.companyName = null;
    this.firstName = null;
    this.lastName = null;
    this.phoneNumber = null;
    this.email = null;
    // customer address
    this.country = null;
    this.city = null;
    this.address1 = null;
    this.postalCode = null;
    this.regionName = null;
    this.state = null;
    this.countryName = null;
    // customer data array
    this.customerData = {};
  }

  /**
   * OCCS Front-end login
   * @param {*} req
   * @param {*} res
   */
  login(req, res) {
    try {
      let username = req.body.username;
      let password = req.body.password;
      //base64 string for proxy authentication
      let base64data = Buffer.from("admin:admin").toString("base64");
      // Login to OCCS
      fetch(process.env.OCCSURL + process.env.ENDPOINTLOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + base64data
        },
        body: `grant_type=password&username=${username}&password=${password}`
      })
        .then(response => {
          return response.json();
        })
        .then(data => {
          this.token = data.access_token;
          // get current profile
          this.getCurrentProfile(res);
        })
        .catch(error => {
          res
            .status(200)
            .send({ message: "Login request to OCCS instance failed" });
        });
    } catch (error) {
      res
        .status(200)
        .send({ message: "There was a problem processing your login request" });
    }
  }

  /**
   * Get the current profile information
   * @param {*} req
   * @param {*} res
   */
  getCurrentProfile(res) {
    try {
      fetch(process.env.OCCSURL + process.env.ENDPOINTPROFILE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        }
      })
        .then(response => {
          return response.json();
        })
        .then(data => {
          // customer profile id
          this.profileId = data.id;
          // customer data
          this.companyId = data.id;
          this.companyName = "Oracle";
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.phoneNumber = data.shippingAddresses[0].phoneNumber;
          this.email = data.email;
          // address
          this.country = data.shippingAddresses[0].country;
          this.city = data.shippingAddresses[0].city;
          this.address1 = data.shippingAddresses[0].address1;
          this.postalCode = data.shippingAddresses[0].postalCode;
          this.regionName = data.shippingAddresses[0].regionName;
          this.state = data.shippingAddresses[0].state;
          this.countryName = data.shippingAddresses[0].countryName;
          // customer data
          this.customerData = {
            companyId: this.companyId,
            companyName: this.companyName,
            firstName: this.firstName,
            lastName: this.lastName,
            phoneNumber: this.phoneNumber,
            email: this.email
          };
          res
            .status(200)
            .send({ cusData: this.customerData, token: this.token });
        })
        .catch(error => {
          res
            .status(200)
            .send({ message: "Error retrieving current user profile" });
        });
    } catch (error) {
      res
        .status(200)
        .send({ message: "Cannot perform getCurrentProfile request" });
    }
  }

  /**
   * Create a new Order on OCCS
   * @param {*} req
   * @param {*} res
   */
  createOrder(req, res) {
    // get the request quantity
    // to-do
    try {
      let quantity = req.body.quantity;
      console.log(quantity);
      this.quantity = quantity;
      // create order
      fetch(process.env.OCCSURL + process.env.ENDPOINTCREATEORDER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        },
        body: JSON.stringify({
          op: "createOrder",
          profileId: this.profileId,
          shippingMethod: {
            value: "hardgoodShippingGroup"
          },
          shoppingCart: {
            items: [
              {
                rawTotalPrice: this.vision5Price,
                returnedQuantity: 0,
                dynamicProperties: [],
                shippingSurchargeValue: 0.0,
                availabilityDate: null,
                externalData: [],
                discountAmount: 0.0,
                preOrderQuantity: 0,
                price: this.vision5Price,
                onSale: false,
                stateDetailsAsUser:
                  "The item has been initialized within the shipping group",
                unitPrice: this.vision5Price,
                amount: this.vision5Price * this.quantity,
                quantity: this.quantity,
                productId: this.productId,
                salePrice: 0.0,
                detailedItemPriceInfo: [
                  {
                    discounted: false,
                    secondaryCurrencyTaxAmount: 0.0,
                    amount: this.vision5Price,
                    quantity: this.quantity,
                    tax: 0.0,
                    orderDiscountShare: 0.0,
                    detailedUnitPrice: this.vision5Price,
                    currencyCode: "EUR"
                  }
                ],
                catRefId: "iphoneXsg256GB",
                discountInfo: [],
                shopperInput: {},
                backOrderQuantity: 0,
                listPrice: this.vision5Price,
                status: "INITIAL"
              }
            ]
          },
          shippingAddress: {
            lastName: this.lastName,
            country: this.country,
            city: this.city,
            prefix: "",
            address1: this.address1,
            postalCode: this.postalCode,
            selectedCountry: this.country,
            firstName: this.firstName,
            phoneNumber: this.phoneNumber,
            faxNumber: "",
            middleName: "",
            state: this.state,
            email: this.email
          },
          requestChannel: "agent",
          dynamicPropertyShippingInstructions: "Test Instructions"
        })
      })
        .then(response => {
          return response.json();
        })
        .then(data => {
          res.status(200).send({ message: data });
        })
        .catch(error => {
          console.log(error);
          res.status(200).send({
            message: "Error creating the order"
          });
        });
    } catch (error) {
      res.status(200).send({ message: "Cannot perform createOrder request" });
    }
  }
}

let occs = new OCCS();
module.exports.OCCS = occs;
