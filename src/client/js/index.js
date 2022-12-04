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


require("../css/style.css")