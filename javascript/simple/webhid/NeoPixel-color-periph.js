
var periphPixels = [];

function addPeriphPixel(seqNo) {
    let pixel = new Pixel(seqNo);
    periphPixels.push(pixel);

    return pixel;
}

function createPeriphPixel(seqno) {    
    let pixel = addPeriphPixel(seqno);
    createPixelHTMLelement(pixel);
    
    return pixel;
}

function getGRBhex32Periph() {
    return periphPixels.sort(function(a,b){
        return (a.seqno > b.seqno) ? 1 : ( (a.seqno==b.seqno) ? 0 : -1 ); 
    }).map(p=>p.color.getGRBhex32()).join(",");
}

function getGRBhexPeriph() {
    return periphPixels.sort(function(a,b){
        return (a.seqno > b.seqno) ? 1 : ( (a.seqno==b.seqno) ? 0 : -1 ); 
    }).map(p=>[p.color.green,p.color.red,p.color.blue]).flat();
}

window.addEventListener("load", function(ev){
    let table = document.createElement("table");
    table.setAttribute("id","peripheral-table");
    document.getElementById("pixel-area-periph").append(table);
    
    document.getElementById("select-file-periph").addEventListener("click", (ev)=>document.getElementById("conf-csv-periph").click());
    
    let confInput = document.getElementById("conf-csv-periph");
    confInput.addEventListener("change", async (ev)=>{
        let b = ev.target.files[0];
        let t = await b.text();
        let a = t.split("\n").filter(l=>l.length>0).map((l)=>l.split(",").map((i)=>parseInt(i)));

        a.forEach(l => {
            let tr = document.createElement("tr");
            document.getElementById("peripheral-table").append(tr);

            l.forEach(c => {
                if(c==255) {
                    tr.append(document.createElement("td"));
                } else {
                    let p = createPeriphPixel(c);
                    tr.append(p.element);
                }
            });
        });
    })

    document.getElementById("save-sequence").addEventListener("click", (ev)=>{
        nrf52_common.sendReport( [0x02, 0x10,] );
    });

    document.getElementById("output-grb").addEventListener("click", async function() {
        let frame = getGRBhexPeriph();
        let l = frame.length;

        let pattern_id = parseInt( document.getElementById("sequence-id").value );
        let frameNo = parseInt( document.getElementById("frame-no").value );
        let frameCount = parseInt( document.getElementById("frame-count").value );
        let interval = parseInt( document.getElementById("interval-ticks").value );
        let bytes_per_packet = 9;

        nrf52_common.sendReport( [0x03, 0x13, pattern_id, frameCount, interval] );
        for (let i = 0; i < l/bytes_per_packet+1; i++) {
            let data = frame.slice(i*bytes_per_packet,(i+1)*bytes_per_packet);
            //console.log(data);
            nrf52_common.sendReport( [0x03, 0x12, pattern_id, frameNo, i*bytes_per_packet/3].concat(data) );
        }
    });
} )
