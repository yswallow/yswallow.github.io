function execute_fetch() {
    let url = document.getElementById("url").value;
    fetch(url).then( (res)=>{
        if(!res.ok) {
            output_area.innerHTML = "ERROR";
        } else {
            output_area.innerHTML = response.text();
        }
    });
}

window.addEventListener("load", function() {
    const output_area = document.getElementById("output-area");
    document.getElementById("exec").addEventListener("click", execute_fetch);
})
