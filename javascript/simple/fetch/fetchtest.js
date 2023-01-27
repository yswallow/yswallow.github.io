let output_area;

function execute_fetch() {
    let url = document.getElementById("url").value;
    fetch(url).then( (res)=>{
        if(!res.ok) {
            output_area.innerHTML = "ERROR";
        } else {
            output_area.innerHTML = res.text();
        }
    });
}

window.addEventListener("load", function() {
    output_area = document.getElementById("output-area");
    document.getElementById("exec").addEventListener("click", execute_fetch);
})
