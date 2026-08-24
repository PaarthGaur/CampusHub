const form =document.getElementById('signupForm');

form.addEventListener('submit',function(event){

    event.preventDefault();

    const fullname=document.getElementById('fullname').value;
    const username=document.getElementById('username').value;
    const email=document.getElementById('email').value;
    const course = document.getElementById('course').value;
    const year = document.getElementById('year').value;
    const semester = document.getElementById('semester').value;
    const password=document.getElementById('password').value;
    const Cpassword=document.getElementById('confirm-password').value;
    const terms=document.getElementById('terms').value;

    if(password!=Cpassword){
        alert("Passwords do not match!");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
    }

    if(!terms){
        alert("Please accept the Terms & Conditions.");
        return;
    }

    const user={

        fullname:fullname,
        username:username,
        email:email,
         course: course,
        year: Number(year),
        semester: Number(semester),
        password:password

    }

    localStorage.setItem("user",JSON.stringify(user));

    alert("Account created successfully!")

    window.location.href = "dashboard.html";

})