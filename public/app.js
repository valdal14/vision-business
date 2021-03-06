var quantity = 1;
var monthlyFee = 15.0;
var activationFee = 10.0;
var totalFee = monthlyFee + activationFee;
var resolution = window.matchMedia("(min-width: 375px) and (max-width: 414px)");
checkBrowserResolution(resolution); // Call listener function at run time
resolution.addListener(checkBrowserResolution); // Attach listener function on state changes

// Hide UI Elements
$("#loginUiFeedback").hide();
$(".bannerLogged").hide();
$(".banner").hide();
$(".bannerLoading").hide();
// disable add to cart button
document.querySelector("#btnAddSimToCart").disabled = true;

/**
 * Check current browser resolution
 */
function checkBrowserResolution(res) {
  // bannersContainer
  if (res.matches) {
    document.querySelector(".bannersContainer").style.backgroundImage =
      "url('visionMobileBanner.png')";
  } else if (localStorage.getItem("VISION5")) {
    document.querySelector(".bannersContainer").style.backgroundImage =
      "url('businessmobiles-logged.png')";
  } else {
    document.querySelector(".bannersContainer").style.backgroundImage =
      "url('businessmobiles.png')";
  }
}

/**
 * Check whether there was a previous session opened
 */
function checkPreviousSession() {
  if (
    localStorage.getItem("VISION5") !== null &&
    localStorage.getItem("VISION5") !== undefined
  ) {
    // hide the modal login button
    $("#modalbutton").hide();
    // parse the data
    var data = JSON.parse(localStorage.getItem("VISION5"));
    // add customer data to the UI
    addLoggedUserToSIM(data);
    // show logged banner
    $(".bannerLogged").show();
    // enable add to cart button
    document.querySelector("#btnAddSimToCart").disabled = false;
    // check resolution and apply banner
    checkBrowserResolution(resolution);
  } else {
    $(".banner").show();
    // check resolution and apply banner
    checkBrowserResolution(resolution);
  }
}

checkPreviousSession();

/**
 * Login
 */
document.querySelector("#sendLogin").addEventListener("click", function(e) {
  e.preventDefault();
  var username = document.querySelector("#username").value;
  var password = document.querySelector("#password").value;
  $(".bannerLoading").show();

  fetch("/login", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      //data to send
      username: username,
      password: password
    })
  })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.token === undefined && data.token === null) {
        loginUIMessage("Error: Impossible to find valid data, try again!");
        $("#loginUiFeedback").show();
        // check resolution and apply banner
        checkBrowserResolution(resolution);
      } else {
        console.log(data.cusData);
        console.log(data.token);
        // perform the getCurrentProfile API request
        loginUIMessage("Login completed successfully");
        $("#loginUiFeedback").show();
        // hide the modal login button
        $("#modalbutton").hide();
        addLoggedUserToSIM(data.cusData);
        saveUserToLocalStorage(data.cusData, data.token);
        // enable add to cart button
        document.querySelector("#btnAddSimToCart").disabled = false;
        // hide banners
        $(".bannerLogged").show();
        $(".banner").hide();
        $(".bannerLoading").hide();
        // check resolution and apply banner
        checkBrowserResolution(resolution);
      }
    })
    .catch(function(error) {
      console.log(error);
      loginUIMessage("Error: " + error);
      $("#loginUiFeedback").show();
      checkBrowserResolution(resolution);
    });
});

/**
 * Add to cart
 */
document
  .querySelector("#btnAddSimToCart")
  .addEventListener("click", function(e) {
    e.preventDefault();
    $(".bannerLoading").show();
    fetch("/createOrder", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        //data to send
        quantity: quantity
      })
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log(data.message.id);
        if (data.message.id !== null && data.message.id !== undefined) {
          $(".bannerLoading").hide();
          // open the new modal
          $("#myModalAddToCart").modal("show");
          // add message to the UI
          loginUIAddToCartMessages(
            "Order created with id: " +
              data.message.id +
              " You would be redirected for the checkout in just few seconds"
          );
          //redirect the user
          setTimeout(function(e) {
            window.location.href =
              "https://ccstore-z5da.oracleoutsourcing.com/cart";
          }, 10000);
        } else {
          // open the new modal
          $("#myModalAddToCart").modal("show");
          loginUIAddToCartMessages(
            "Error : We could not create your order, please try again!!!"
          );
          $(".bannerLoading").hide();
        }
      })
      .catch(function(error) {
        // open the new modal
        $("#myModalAddToCart").modal("show");
        loginUIAddToCartMessages("Error: " + error);
        $(".bannerLoading").hide();
      });
  });

/**
 * Add the logged user info to the UI
 * @param {dictionary} customerData
 */
function addLoggedUserToSIM(customerData) {
  document.querySelector("#companyId").value = customerData.companyId;
  document.querySelector("#companyName").value = customerData.companyName;
  document.querySelector("#simFirstName").value = customerData.firstName;
  document.querySelector("#simLastName").value = customerData.lastName;
  document.querySelector("#phoneNumber").value = customerData.phoneNumber;
  document.querySelector("#emailCustomer").value = customerData.email;
  document.querySelector("#bannerUsername").innerHTML = customerData.firstName;
}

/**
 * Save user info and token session to the local storage
 * @param {*} customerData
 * @param {*} token
 */
function saveUserToLocalStorage(customerData, token) {
  localStorage.setItem(
    "VISION5",
    JSON.stringify({
      companyId: customerData.companyId,
      companyName: customerData.companyName,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phoneNumber: customerData.phoneNumber,
      email: customerData.email,
      token: token
    })
  );
}

/**
 * Log Login responses to the UI
 * @param {string} message
 */
function loginUIMessage(message) {
  if (message.includes("Error")) {
    document.querySelector("#loginUiFeedback").classList.remove("alert");
    document
      .querySelector("#loginUiFeedback")
      .classList.remove("alert-dismissible");
    document
      .querySelector("#loginUiFeedback")
      .classList.remove("alert-success");
    document.querySelector("#loginUiFeedback").classList.add("alert");
    document
      .querySelector("#loginUiFeedback")
      .classList.add("alert-dismissible");
    document.querySelector("#loginUiFeedback").classList.add("alert-danger");
    document.querySelector("#logMessageResponse").innerHTML = message;
  } else {
    document.querySelector("#loginUiFeedback").classList.remove("alert");
    document
      .querySelector("#loginUiFeedback")
      .classList.remove("alert-dismissible");
    document.querySelector("#loginUiFeedback").classList.remove("alert-danger");
    document.querySelector("#loginUiFeedback").classList.add("alert");
    document
      .querySelector("#loginUiFeedback")
      .classList.add("alert-dismissible");
    document.querySelector("#loginUiFeedback").classList.add("alert-success");
    document.querySelector("#logMessageResponse").innerHTML = message;
    // dismiss the modal
    $("#myModal").modal("hide");
  }
}

/**
 * Log Login responses to the UI
 * @param {string} message
 */
function loginUIAddToCartMessages(message) {
  if (message.includes("Error")) {
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert-dismissible");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert-success");
    document.querySelector("#loginUiFeedbackAddToCart").classList.add("alert");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.add("alert-dismissible");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.add("alert-danger");
    document.querySelector("#loginUiFeedbackAddToCart").innerHTML = message;
  } else {
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert-dismissible");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.remove("alert-danger");
    document.querySelector("#loginUiFeedbackAddToCart").classList.add("alert");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.add("alert-dismissible");
    document
      .querySelector("#loginUiFeedbackAddToCart")
      .classList.add("alert-success");
    document.querySelector("#loginUiFeedbackAddToCart").innerHTML = message;
  }
}

// redirect to commerce cloud
document.querySelector("#btnAnonymous").addEventListener("click", function(e) {
  window.location.href = "https://ccstore-z5da.oracleoutsourcing.com";
});

// redirect to commerce cloud
document.querySelector("#btnLogged").addEventListener("click", function(e) {
  window.location.href = "https://ccstore-z5da.oracleoutsourcing.com";
});

/**
 * Calculate Prices
 */
function calculatePrices() {
  var mFee = monthlyFee * quantity;
  var total = mFee + activationFee;

  document.querySelector("#monthlyFee").innerHTML = "€ " + mFee;
  document.querySelector("#fixedPrice").innerHTML = "€ " + activationFee;
  document.querySelector("#amount").innerHTML = "€ " + total;
}

/**
 * Add a new SIM
 */
document.querySelector("#addService").addEventListener("click", function(e) {
  quantity += 1;
  document.querySelector("#serviceAmount").innerHTML = quantity;
  // addNewSim();
  addNewSimToUI("Move to Vision");
  calculatePrices();
  addNewSimWithForm();
});

document.querySelector("#removeService").addEventListener("click", function(e) {
  if (quantity > 1) {
    var removeSimName = "col-lg-12 col-sm-12 simLayout" + quantity.toString();
    var removeCartSim = "col-12 simVision" + quantity.toString();
    var removeSpacer = "spacer" + quantity.toString();
    removeSim(removeSimName, removeCartSim, removeSpacer);
    quantity -= 1;
    document.querySelector("#serviceAmount").innerHTML = quantity;
    calculatePrices();
  }
});

function removeSim(simName, simElement, spacer) {
  var elem = document.querySelector("[class=" + CSS.escape(simName) + "]");
  var cartElem = document.querySelector(
    "[class=" + CSS.escape(simElement) + "]"
  );
  var sp = document.querySelector("[id=" + CSS.escape(spacer) + "]");
  elem.remove();
  cartElem.remove();
  sp.remove();
}

function addNewSimToUI(text) {
  // container recap
  var parent = document.querySelector(".cartRecapSIMContainer");
  // parent div simVision
  var simVision = document.createElement("div");
  simVision.setAttribute("class", "col-12 simVision" + quantity);
  // add simVision to the recap div
  parent.appendChild(simVision);
  // newSimText
  var newSimText = document.createElement("div");
  newSimText.setAttribute("class", "col-12 textTwo");
  newSimText.textContent = "SIM NUMBER " + quantity;
  // add newSimText to simVision
  simVision.appendChild(newSimText);

  // newSimText2
  var newSimText2 = document.createElement("div");
  newSimText2.setAttribute("class", "col-12 textTwo");
  var spanText = document.createElement("span");
  spanText.setAttribute("class", "prices");
  spanText.setAttribute("id", "desc" + quantity);
  spanText.textContent = text;
  newSimText2.textContent = "Option: ";
  // append the span with style
  newSimText2.appendChild(spanText);
  // add newSimText to simVision
  simVision.appendChild(newSimText2);

  // divHr
  var divHr = document.createElement("div");
  divHr.setAttribute("class", "col-12");
  // hr
  var hr = document.createElement("hr");
  hr.setAttribute("class", "new");
  // append hr
  divHr.appendChild(hr);
  // append divHr
  simVision.appendChild(divHr);
}

// FROM HERE
function addNewSimWithForm() {
  // planOptions parent
  var parent = document.querySelector(".planOptions");
  // simLayout
  var simLayout = document.createElement("div");
  simLayout.setAttribute("class", "col-lg-12 col-sm-12 simLayout" + quantity);
  simLayout.setAttribute("style", "padding-bottom:20px;");
  simLayout.setAttribute("style", "background-color: #fafafa;");
  // row
  var rowOne = document.createElement("div");
  rowOne.setAttribute("class", "row");
  simLayout.appendChild(rowOne);
  // simSelection
  var simSelection = document.createElement("div");
  simSelection.setAttribute("class", "col-lg-4 col-sm-12 simSelection");
  rowOne.appendChild(simSelection);
  // simNumber
  var simNumber = document.createElement("div");
  simNumber.setAttribute("class", "col-lg-12 col-sm-12 simNumber");
  simNumber.textContent = "SIM NUMBER " + quantity;
  simSelection.appendChild(simNumber);
  // hr
  var hrOne = document.createElement("hr");
  simSelection.appendChild(hrOne);
  // rowTwo
  var rowTwo = document.createElement("div");
  rowTwo.setAttribute("class", "row");
  simSelection.appendChild(rowTwo);
  // div
  var newDivOne = document.createElement("div");
  newDivOne.setAttribute("class", "col-lg-2 d-none d-lg-block");
  rowTwo.appendChild(newDivOne);
  // image
  var imageVision = document.createElement("img");
  imageVision.setAttribute("src", "vision-sim-icon.png");
  imageVision.setAttribute("alt", "Sim");
  newDivOne.appendChild(imageVision);
  // newDivTwo
  var newDivTwo = document.createElement("div");
  newDivTwo.setAttribute("class", "col-lg-10 col-sm-6 simOperator");
  // here
  rowTwo.appendChild(newDivTwo);
  // select
  var select = document.createElement("select");
  select.setAttribute("class", "form-control");
  select.setAttribute("id", "selectNewSimOperator" + quantity);
  // Add event listener to select
  select.addEventListener("change", function(e) {
    console.log("text changed");
    document.querySelector(
      "#desc" + quantity
    ).innerHTML = document.querySelector(
      "#selectNewSimOperator" + quantity
    ).value;
  });
  newDivTwo.appendChild(select);
  // optionOne
  var optionOne = document.createElement("option");
  optionOne.textContent = "Move to Vision";
  select.appendChild(optionOne);
  // optionTwo
  var optionTwo = document.createElement("option");
  optionTwo.textContent = "Keep your number";
  select.appendChild(optionTwo);
  // customerData
  var customerData = document.createElement("div");
  customerData.setAttribute("class", "col-lg-8 col-sm-12 customerData");
  rowOne.appendChild(customerData);
  // rowThree
  var rowThree = document.createElement("div");
  rowThree.setAttribute("class", "row");
  customerData.appendChild(rowThree);
  // divThree
  var divThree = document.createElement("div");
  divThree.setAttribute("class", "col-6");
  rowThree.appendChild(divThree);
  // formGroup
  var formGroup = document.createElement("div");
  formGroup.setAttribute("class", "form-group");
  divThree.appendChild(formGroup);
  // labelOne
  var labelOne = document.createElement("label");
  labelOne.setAttribute("for", "companyId" + quantity);
  labelOne.textContent = "Company ID";
  formGroup.appendChild(labelOne);
  // inputOne
  var inputOne = document.createElement("input");
  inputOne.setAttribute("type", "number");
  inputOne.setAttribute("class", "form-control");
  inputOne.setAttribute("id", "companyId" + quantity);
  inputOne.setAttribute("placeholder", "ES 1000000000");
  formGroup.appendChild(inputOne);
  // HERE
  // divFour
  var divFour = document.createElement("div");
  divFour.setAttribute("class", "col-6");
  rowThree.appendChild(divFour);
  // formGroupTwo
  var formGroupTwo = document.createElement("div");
  formGroupTwo.setAttribute("class", "form-group");
  divFour.appendChild(formGroupTwo);
  // labelTwo
  var labelTwo = document.createElement("label");
  labelTwo.setAttribute("for", "companyName" + quantity);
  labelTwo.textContent = "Company Name";
  formGroupTwo.appendChild(labelTwo);
  // inputTwo
  var inputTwo = document.createElement("input");
  inputTwo.setAttribute("type", "text");
  inputTwo.setAttribute("class", "form-control");
  inputTwo.setAttribute("id", "companyName" + quantity);
  inputTwo.setAttribute("placeholder", "Vision Supremo");
  formGroupTwo.appendChild(inputTwo);
  // HERE TWO
  // divFive
  var divFive = document.createElement("div");
  divFive.setAttribute("class", "col-6");
  rowThree.appendChild(divFive);
  // formGroupThree
  var formGroupThree = document.createElement("div");
  formGroupThree.setAttribute("class", "form-group");
  divFive.appendChild(formGroupThree);
  // labelThree
  var labelThree = document.createElement("label");
  labelThree.setAttribute("for", "simFirstName" + quantity);
  labelThree.textContent = "SIM owner first name";
  formGroupThree.appendChild(labelThree);
  // inputThree
  var inputThree = document.createElement("input");
  inputThree.setAttribute("type", "text");
  inputThree.setAttribute("class", "form-control");
  inputThree.setAttribute("id", "simFirstName" + quantity);
  inputThree.setAttribute("placeholder", "Mario");
  formGroupThree.appendChild(inputThree);
  // HERE
  // divSix
  var divSix = document.createElement("div");
  divSix.setAttribute("class", "col-6");
  rowThree.appendChild(divSix);
  // formGroupFour
  var formGroupFour = document.createElement("div");
  formGroupFour.setAttribute("class", "form-group");
  divSix.appendChild(formGroupFour);
  // labelFour
  var labelFour = document.createElement("label");
  labelFour.setAttribute("for", "simLastName" + quantity);
  labelFour.textContent = "SIM owner last name";
  formGroupFour.appendChild(labelFour);
  // inputFour
  var inputFour = document.createElement("input");
  inputFour.setAttribute("type", "text");
  inputFour.setAttribute("class", "form-control");
  inputFour.setAttribute("id", "simLastName" + quantity);
  inputFour.setAttribute("placeholder", "Rossi");
  formGroupFour.appendChild(inputFour);
  // HERE
  // divSeven
  var divSeven = document.createElement("div");
  divSeven.setAttribute("class", "col-6");
  rowThree.appendChild(divSeven);
  // formGroupFive
  var formGroupFive = document.createElement("div");
  formGroupFive.setAttribute("class", "form-group");
  divSeven.appendChild(formGroupFive);
  // labelFive
  var labelFive = document.createElement("label");
  labelFive.setAttribute("for", "phoneNumber" + quantity);
  labelFive.textContent = "Phone number";
  formGroupFive.appendChild(labelFive);
  // inputFive
  var inputFive = document.createElement("input");
  inputFive.setAttribute("type", "tel");
  inputFive.setAttribute("class", "form-control");
  inputFive.setAttribute("id", "phoneNumber" + quantity);
  inputFive.setAttribute("placeholder", "063648718267");
  formGroupFive.appendChild(inputFive);
  // HERE
  // divEight
  var divEight = document.createElement("div");
  divEight.setAttribute("class", "col-6");
  rowThree.appendChild(divEight);
  // formGroupSix
  var formGroupSix = document.createElement("div");
  formGroupSix.setAttribute("class", "form-group");
  divEight.appendChild(formGroupSix);
  // labelSix
  var labelSix = document.createElement("label");
  labelSix.setAttribute("for", "emailCustomer" + quantity);
  labelSix.textContent = "Email address";
  formGroupSix.appendChild(labelSix);
  // inputSix
  var inputSix = document.createElement("input");
  inputSix.setAttribute("type", "email");
  inputSix.setAttribute("class", "form-control");
  inputSix.setAttribute("id", "emailCustomer" + quantity);
  inputSix.setAttribute("placeholder", "m.rossi@email.com");
  formGroupSix.appendChild(inputSix);

  // spacer
  var spacer = document.createElement("div");
  spacer.setAttribute("id", "spacer" + quantity);
  spacer.setAttribute("class", "spacer");
  // add simLayout to parent planOptions
  parent.appendChild(simLayout);
  parent.appendChild(spacer);
}

/**
 * Update the SIM description into the cart
 */
document
  .querySelector("#selectNewSimOperator")
  .addEventListener("change", function(e) {
    document.querySelector("#desc").innerHTML = document.querySelector(
      "#selectNewSimOperator"
    ).value;
  });
