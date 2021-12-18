function get2digitHex(i) {
    s = i.toString(0x10);
    if(s.length==2) {
        return s;
    } else {
        return "0"+s;
    }
}


class Pixel {
    constructor(seqno) {
        this.seqno = seqno;
        this.color = {
            red: 0x40, green: 0x40, blue: 0x40,
            getColorCode: function() {
                return "#"+get2digitHex(this.red)+get2digitHex(this.green)+get2digitHex(this.blue);
            },
            getGRBhex32: function() {
                return "0x00"+get2digitHex(this.green)+get2digitHex(this.red)+get2digitHex(this.blue);
            },
        }
    }

    setElement(el) {
        this.element = el;
        this.applyColor();
    }

    applyColor() {
        this.element.setAttribute("style", "background-color: "+this.color.getColorCode()+";");
    }

    setSeqNo(seqno) {
        this.seqno = seqno;
    }
}

pixelSeqNo = 0;
pixels = [];

function addPixel(seqNo) {
    pixel = new Pixel(seqNo);
    pixels.push(pixel);

    return pixel;
}

function createColorElement(r,g,b,c) {
    let s = document.createElement("span");
    s.r = r;
    s.g = g;
    s.b = b;
    s.setAttribute("style", "color: #"+get2digitHex(r)+get2digitHex(g)+get2digitHex(b)+";");
    s.addEventListener("click", (ev)=>{
        pixel = ev.target.parentElement.parentElement.pixel;
        pixel.color.red = ev.target.r;
        pixel.color.green = ev.target.g;
        pixel.color.blue = ev.target.b;
        pixel.applyColor();
    });
    s.innerHTML = c;
    return s;
}

function createPixelHTMLelement(pixel) {
    data = document.createElement("td");
    pixel.setElement(data);
    data.pixel = pixel;

    d1 = document.createElement("div");
    d1.append( createColorElement(255,255,255,"W ") );
    d1.append( createColorElement(0,0,0,"Bk") );
    d1.append( createColorElement(64,64,64,"Gy") );
    data.append(d1);

    d2 = document.createElement("div");
    d2.append( createColorElement(255,0,0,"R ") );
    d2.append( createColorElement(255,255,0,"Y ") );
    d2.append( createColorElement(0,255,0,"Gn") );
    data.append(d2);

    d3 = document.createElement("div");
    d3.append( createColorElement(255,0,255,"M ") );
    d3.append( createColorElement(0,0,255,"Bl") );
    d3.append( createColorElement(0,255,255,"C ") );
    data.append(d3);
}

function createPixel(seqno) {
    pixel = addPixel(seqno);
    createPixelHTMLelement(pixel);

    return pixel;
}

function createDetailedPixel(seqno) {
    data = document.createElement("td");
    
    pixel = addPixel();
    pixel.setElement(data);
    pixel.setSeqNo(seqno);
    data.pixel = pixel;
/*
    seqno = createNumberInput(pixel.seqno, 0, 120);
    seqno.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.seqno = parseInt(this.value);});
    data.append(seqno);
*/ 
    r = createNumberInput(pixel.color.red, 0, 255);
    r.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.color.red = parseInt(this.value); pixel.applyColor();});
    data.append(r);

    g = createNumberInput(pixel.color.green, 0, 255);
    g.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.color.green = parseInt(this.value); pixel.applyColor();});
    data.append(g);
    
    b = createNumberInput(pixel.color.blue, 0, 255);
    b.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.color.blue = parseInt(this.value); pixel.applyColor();});
    data.append(b);
    
    return pixel;
}

function getGRBhex32() {
    return pixels.sort(function(a,b){
        return (a.seqno > b.seqno) ? 1 : ( (a.seqno==b.seqno) ? 0 : -1 ); 
    }).map(p=>p.color.getGRBhex32()).join(",");
}

function getGRBhex() {
    return pixels.sort(function(a,b){
        return (a.seqno > b.seqno) ? 1 : ( (a.seqno==b.seqno) ? 0 : -1 ); 
    }).map(p=>[p.color.green,p.color.red,p.color.blue]).flat();
}

function createNumberInput(init, min, max) {
    let el = document.createElement("input");
    el.setAttribute("type", "number");
    el.setAttribute("value", init);
    el.setAttribute("min", min);
    el.setAttribute("max", max);
    el.setAttribute("class", "num-input");
    return el;
}

function parseHidResponse(event) {}


window.addEventListener("load", function(ev){
    let area = document.getElementById("pixel-area");
    let table = document.createElement("table");
    table.setAttribute("id","central-table");
    area.append(table);

    document.getElementById("select-file").addEventListener("click", (ev)=>document.getElementById("conf-csv").click());
    
    let confInput = document.getElementById("conf-csv");
    confInput.addEventListener("change", async (ev)=>{
        let table = document.getElementById("central-table");
        let b = ev.target.files[0];
        let t = await b.text();
        let a = t.split("\n").filter(l=>l.length>0).map((l)=>l.split(",").map((i)=>parseInt(i)));

        a.forEach(l => {
            let tr = document.createElement("tr");
            table.append(tr);

            l.forEach(c => {
                if(c==255) {
                    tr.append(document.createElement("td"));
                } else {
                    p = createPixel(c);
                    tr.append(p.element);
                }
            });
        });
    })

    document.getElementById("execute").addEventListener("click", Connect);
    document.getElementById("save-sequence").addEventListener("click", (ev)=>{
        nrf52_common.sendReport( new Uint8Array( [0x02, 0x10,] ));
    });
    document.getElementById("output-grb").addEventListener("click", async function() {
        let frame = getGRBhex();
        let l = frame.length;

        let pattern_id = parseInt( document.getElementById("sequence-id").value );
        let frameNo = parseInt( document.getElementById("frame-no").value );
        let frameCount = parseInt( document.getElementById("frame-count").value );
        let interval = parseInt( document.getElementById("interval-ticks").value );

        nrf52_common.sendReport( new Uint8Array( [0x03, 0x11, pattern_id, frameCount, interval] ) );
        for (let i = 0; i < l/27+1; i++) {
            let data = frame.slice(i*27,(i+1)*27);
            //console.log(data);
            nrf52_common.sendReport( new Uint8Array( [0x03, 0x10, pattern_id, frameNo, i*9].concat(data) ));
        }
    });
} )