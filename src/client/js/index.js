// BOOTSTRAP VALIDATIONS
(function () {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        const clickedButton = event.submitter;
        if (form.checkValidity()) {
          clickedButton.id === "postSubmit" ? createPost() : getPreview();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// IMPORT CSS

require("../css/style.css");

// FORM

// BUILD REQUEST BODY

async function buildBody() {
  const body = {
    text: await document.getElementById("textArea").value,
    background: await document.querySelector(
      'input[name="backgroundSelection"]:checked'
    ).value,
  };
  return JSON.stringify(body);
}

// GET PREVIEW

const previewField = document.getElementById("imagePreview");

async function getPreview() {
  try {
    const response = await fetch("http://localhost:4555/getPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await buildBody(),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(errorMessage);
      return;
    }

    const base64String = await response.text();
    previewField.src = `data:image/png;base64,${base64String}`;
  } catch (error) {
    console.error(error);
  }
}

// POST PHOTO

async function createPost() {

  if (!spamValidation()) {
    console.log("You have to wait")
    return;
  }

  try {
    const response = await fetch("http://localhost:4555/createPost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await buildBody(),
    }).then(() => setLastPostDate());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// SPAM PREVENTION

function setLastPostDate() {
  let lastPostDate = new Date();
  let lastPostDateString = lastPostDate.toISOString();
  localStorage.setItem("lastPostDate", lastPostDateString);
}

function spamValidation() {
  let currentDate = new Date();
  let lastPostDateString = localStorage.getItem("lastPostDate");
  let lastPostDate = new Date(lastPostDateString);

  if (!lastPostDateString || currentDate - lastPostDate > 28800000) {
    return true;
  } else {
    let reimainingTime = 28800000 - (currentDate - lastPostDate)
    document.getElementById("reimainingTimeField").innerText = "Podrás hacer otra publicación en " + parseMillisecondsIntoTime(reimainingTime)
    document.getElementById("reimainingTimeField").style.display = 'block'
    return false;
  }
}



// CLOSE NAVBAR WHEN CLICK

const navLinks = document.querySelectorAll(".nav-link");
const menuToggle = document.getElementById("navbarMenu");
const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false });
navLinks.forEach((l) => {
  l.addEventListener("click", () => {
    bsCollapse.toggle();
  });
});

// MILISECONDS TO TIME 

function parseMillisecondsIntoTime(milliseconds){
    //Get hours from milliseconds
    var hours = milliseconds / (1000*60*60);
    var absoluteHours = Math.floor(hours);
    var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;
  
    //Get remainder from hours and convert to minutes
    var minutes = (hours - absoluteHours) * 60;
    var absoluteMinutes = Math.floor(minutes);
    var m = absoluteMinutes > 9 ? absoluteMinutes : '0' +  absoluteMinutes;
  
    //Get remainder from minutes and convert to seconds
    var seconds = (minutes - absoluteMinutes) * 60;
    var absoluteSeconds = Math.floor(seconds);
    var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;
  
  
    return h + ':' + m + ':' + s;
  }
  
  
