// BOOTSTRAP VALIDATIONS

(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                formSubmit()
                form.classList.add('was-validated')
            }, false)
        })
})()


// FORM 

function formSubmit(){
    const body = { text: document.getElementById("textArea").value }
    
    fetch('http://localhost:4555/sendMessage', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
}

// CLOSE NAVBAR WHEN CLICK

const navLinks = document.querySelectorAll('.nav-link')
const menuToggle = document.getElementById('navbarMenu')
const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false })
navLinks.forEach((l) => {
    l.addEventListener('click', () => { bsCollapse.toggle() })
})



require("../css/style.css")