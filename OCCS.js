require("dotenv").config();
const fetch = require("node-fetch");

class OCCS {
  constructor() {
    // token
    this.token = null;
    // order info
    this.orderId = null;
    this.productId = null;
    this.catRefId = null; // vision5 sku
    // customer data
    this.companyId = null;
    this.companyName = null;
    this.firstName = null;
    this.lastName = null;
    this.phoneNumber = null;
    this.email = null;
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
          console.log(data.access_token);
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
          this.companyId = data.id;
          this.companyName = "Oracle";
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.phoneNumber = data.shippingAddresses[0].phoneNumber;
          this.email = data.email;

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
   * Get current order
   * @param {*} res
   */
  getOrder(res) {
    try {
      fetch(process.env.OCCSURL + process.env.ENDPOINTGETORDER, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.token
        }
      })
        .then(response => {
          if (response.status === 204) {
            res.status(200).send({ message: response.status });
          } else {
            return response.json();
          }
        })
        .then(data => {
          if (data.orderId !== null && data.orderId !== undefined) {
            // create the order
            //this.createOrderHelper(productToAdd, res);
            this.orderId = data.orderId;
            res
              .status(200)
              .send({ message: [this.orderId, this.customerData] });
          } else {
            res.status(200).send({
              message: "No valid orderId found"
            });
          }
        })
        .catch(error => {
          console.log(error);
          res.status(200).send({
            message: "Error retrieving your order"
          });
        });
    } catch (error) {
      res.status(200).send({ message: "Cannot perform getOrder request" });
    }
  }

  /**
   * Create an order on OCCS
   * @param {*} req
   * @param {*} res
   */
  createOrder(req, res) {
    // first get the orderId
    try {
      // get the data from req
      let products = req.body.products;
      let cartSize = products.length;
      let productToAdd = [];

      for (let i = 0; i < cartSize; i++) {
        productToAdd.push({
          rawTotalPrice: products[i].price,
          returnedQuantity: 0,
          dynamicProperties: [],
          shippingSurchargeValue: 0.0,
          availabilityDate: null,
          externalData: [],
          discountAmount: 0.0,
          preOrderQuantity: 0,
          commerceItemId: "ci7001057",
          price: products[i].price,
          onSale: false,
          stateDetailsAsUser:
            "The item has been initialized within the shipping group",
          commerceId: "ci7001057",
          unitPrice: products[i].price,
          amount: products[i].price,
          quantity: 1,
          productId: products[i].productId,
          salePrice: 0.0,
          detailedItemPriceInfo: [
            {
              discounted: false,
              secondaryCurrencyTaxAmount: 0.0,
              amount: products[i].price,
              quantity: 1,
              tax: 0.0,
              orderDiscountShare: 0.0,
              detailedUnitPrice: products[i].price,
              currencyCode: "EUR"
            }
          ],
          catRefId: products[i].sku,
          discountInfo: [],
          shopperInput: {},
          backOrderQuantity: 0,
          listPrice: products[i].price,
          status: "INITIAL"
        });
      }

      // retrieving the current cart == orderId
      fetch(process.env.OCCSURL + process.env.ENDPOINTGETORDER, {
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
          if (data.orderId !== null && data.orderId !== undefined) {
            // create the order
            this.createOrderHelper(productToAdd, res);
          } else {
            res.status(200).send({
              message: "No valid orderId found"
            });
          }
        })
        .catch(error => {
          console.log(error);
          res.status(200).send({
            message: "Error retrieving your order"
          });
        });
    } catch (error) {
      res.status(200).send({ message: "Cannot perform createOrder request" });
    }
  }

  // create order helper
  createOrderHelper(productToAdd, res) {
    // create order
    fetch(process.env.OCCSURL + process.env.ENDPOINTCREATEORDER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.token
      },
      body: JSON.stringify({
        op: "createOrder",
        profileId: "1380313",
        shippingMethod: {
          shippingTax: 0.0,
          value: null,
          cost: 0.0
        },
        shoppingCart: {
          items: productToAdd
        },
        shippingAddress: {
          lastName: "DAlessio",
          country: "US",
          city: "Miami",
          prefix: "",
          address1: "Main Street",
          postalCode: "10101",
          DEFAULT_POSTAL_CODE_PATTERN:
            "^[0-9a-zA-Z]{1,}([ -][0-9a-zA-Z]{1,})?$",
          selectedCountry: "US",
          firstName: "Valerio",
          phoneNumber: "973-974-1234",
          faxNumber: "",
          middleName: "",
          state: "FL",
          email: "valerio.dalessio@oracle.com",
          selectedState: "FL",
          state_ISOCode: "US-FL"
        },
        requestChannel: "agent",
        dynamicPropertyShippingInstructions: "Test Instructions"
      })
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log(data);
        res.status(200).send({ message: data });
      })
      .catch(error => {
        console.log(error);
        res.status(200).send({
          message: "Error creating the order"
        });
      });
  }
}

let occs = new OCCS();
module.exports.OCCS = occs;
