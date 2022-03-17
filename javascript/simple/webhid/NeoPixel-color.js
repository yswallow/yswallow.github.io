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

    setPosition(row, col) {
        this.row = row;
        this.col = col;
    }

    applyColor() {
        this.element.setAttribute("style", "background-color: "+this.color.getColorCode()+";");
    }

    setSeqNo(seqno) {
        this.seqno = seqno;
    }
}

pixelSeqNo = 0;
var pixels = [];
pixels.sort_by_seqno = function() { 
    return this.sort(function(a,b){
            return (a.seqno > b.seqno) ? 1 : ( (a.seqno==b.seqno) ? 0 : -1 );
        }); 
}
var sortedCentralPixels = [];
var centralPixelArray = [];
const segData = [0x77,0x24,0x5D,0x6D,0x2E,0x6B,0x7B,0x27,0x7F,0x6F];

function addPixel(seqNo) {
    let pixel = new Pixel(seqNo);
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
        let pixel = ev.target.parentElement.parentElement.pixel;
        pixel.color.red = ev.target.r;
        pixel.color.green = ev.target.g;
        pixel.color.blue = ev.target.b;
        pixel.applyColor();
    });
    s.innerHTML = c;
    return s;
}

function createPixelHTMLelement(pixel) {
    let data = document.createElement("td");
    pixel.setElement(data);
    data.pixel = pixel;

    let d1 = document.createElement("div");
    d1.append( createColorElement(255,255,255,"W ") );
    d1.append( createColorElement(0,0,0,"Bk") );
    d1.append( createColorElement(64,64,64,"Gy") );
    data.append(d1);

    let d2 = document.createElement("div");
    d2.append( createColorElement(255,0,0,"R ") );
    d2.append( createColorElement(255,255,0,"Y ") );
    d2.append( createColorElement(0,255,0,"Gn") );
    data.append(d2);

    let d3 = document.createElement("div");
    d3.append( createColorElement(255,0,255,"M ") );
    d3.append( createColorElement(0,0,255,"Bl") );
    d3.append( createColorElement(0,255,255,"C ") );
    data.append(d3);
}

function createPixel(seqno) {
    let pixel = addPixel(seqno);
    createPixelHTMLelement(pixel);

    return pixel;
}

function createDetailedPixel(seqno) {
    let data = document.createElement("td");
    
    let pixel = addPixel();
    pixel.setElement(data);
    pixel.setSeqNo(seqno);
    data.pixel = pixel;
/*
    seqno = createNumberInput(pixel.seqno, 0, 120);
    seqno.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.seqno = parseInt(this.value);});
    data.append(seqno);
*/ 
    let r = createNumberInput(pixel.color.red, 0, 255);
    r.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.color.red = parseInt(this.value); pixel.applyColor();});
    data.append(r);

    let g = createNumberInput(pixel.color.green, 0, 255);
    g.addEventListener("change", function() { pixel = this.parentElement.pixel; pixel.color.green = parseInt(this.value); pixel.applyColor();});
    data.append(g);
    
    let b = createNumberInput(pixel.color.blue, 0, 255);
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

function setFullBlack() {
    pixels.forEach( (p)=>{
        p.color.green = p.color.red = p.color.blue = 0;
    })
}

function setWhite(c0, c1, r0, r1,val) {
    //console.log(c0,c1,r0,r1);
    for(let c=c0;c<c1;c++) {
        for(let r=r0;r<r1;r++) {
            if(centralPixelArray[r][c] != 255) {
                let color = sortedCentralPixels[centralPixelArray[r][c]].color;
                if(val==1) {
                    color.red = 255;
                    color.green = 255;
                    color.blue = 0;
                } else if(val==2) {
                    color.red = 0;
                    color.green = 255;
                    color.blue = 255;
                } else {
                    color.red = color.green = color.blue = val;
                }
                
            }
        }
    }
}

function setSegments(s, width, shift,val) {
    let seg = segData[s];
    let rows = centralPixelArray.length;
    let cols = centralPixelArray[0].length;
    
    let col_width = parseInt(width/3);
    let col_amari = width - col_width*3;
    let c0_b = shift;
    let c1_b = c0_b + col_width;
    let c2_b = c1_b + col_width + col_amari;
    let c2_e = shift+width;

    let row_height = parseInt(rows/5);
    let row_amari = rows - row_height*5;
    let r0_b = 0;
    let r1_b = row_height;
    let r2_b = r1_b + row_height + (row_amari>1 ? 1 : 0);
    let r3_b = r2_b + row_height + (row_amari>2 ? 1 : 0);
    let r4_b = r3_b + row_height + (row_amari>0 ? 1 : 0);
    let r4_e = rows;

    //console.log(c0_b,c1_b,c2_b,c2_e,r0_b,r1_b,r2_b,r3_b,r4_b,r4_e);
    for(let i=0;i<8;i++) {
        if( seg & (1<<i) ) {
            switch(i){
                case 0:
                    setWhite(c0_b,c2_e,r0_b,r1_b,val);
                    break;
                case 1:
                    setWhite(c0_b,c1_b,r0_b,r3_b,val);
                    break;
                case 2:
                    setWhite(c2_b,c2_e,r0_b,r3_b,val);
                    break;
                case 3:
                    setWhite(c0_b,c2_e,r2_b,r3_b,val);
                    break;
                case 4:
                    setWhite(c0_b,c1_b,r2_b,r4_e,val);
                    break;
                case 5:
                    setWhite(c2_b,c2_e,r2_b,r4_e,val);
                    break;
                case 6:
                    setWhite(c0_b,c2_e,r4_b,r4_e,val);
                    break;
            }
        }
    }
}

function showSecond(s) {
    let hier = parseInt( s / 10);
    let lower = s % 10;
    let rows = centralPixelArray.length;
    let cols = centralPixelArray[0].length;
    
    //console.log(s);
    setFullBlack();
    setSegments(hier, parseInt(cols/2), 0, 1);
    setSegments(lower,parseInt(cols/2), parseInt(cols/2), 2);

    pixels.forEach( (p)=>{p.applyColor();} );
}


function setTime() {
    let t = new Date();
    let s = t.getSeconds();

    showSecond(s);
}

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    console.log("In:"+view);
}

function connectCallback() {
    let t = new Date();
    nrf52_common.sendReport(new Uint8Array([0x03,0x16,t.getHours(),t.getMinutes(),t.getSeconds()]));
}

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
        centralPixelArray = a;

        for(let row=0;row<a.length;row++) {
            let l = a[row];
            let tr = document.createElement("tr");
            table.append(tr);

            for(let col=0;col<l.length;col++) {
                let c = l[col];
                if(c==255) {
                    tr.append(document.createElement("td"));
                } else {
                    let p = createPixel(c);
                    p.setPosition(row, col);
                    tr.append(p.element);
                }
            }
        }

        sortedCentralPixels = pixels.sort_by_seqno();
        for(let i=0;i<sortedCentralPixels.length;i++) {
            let p = sortedCentralPixels[i];
            centralPixelArray[p.row][p.col] = i;
        }
    })

    document.getElementById("check").addEventListener("click", function(){
        nrf52_common.sendReport( new Uint8Array( [0x02, 0x15] ));
        for(let i=0;i<centralPixelArray.length;i++) {
            nrf52_common.sendReport( new Uint8Array( [0x02, 0x14, i] ));
        }
        
    });

    document.getElementById("clock").addEventListener("click", function(){
        setInterval(setTime, 1000);
        nrf52_common.sendReport( new Uint8Array( [0x03, 0x15, centralPixelArray.length, centralPixelArray[0].length]));
        for(let i=0;i<centralPixelArray.length;i++) {
            nrf52_common.sendReport( new Uint8Array( [[0x03, 0x14, i], centralPixelArray[i]].flat() ));
        }
        nrf52_common.sendReport( new Uint8Array( [0x02, 0x14,] ));
    });

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

    document.getElementById("set-script").addEventListener("click", function() {
        let userScript = "compute_pixels.push( function (frame, col, row) { ";
        userScript += document.getElementById("user-script-input").value;
        userScript += "});";
        let s = document.createElement("script");
        s.innerHTML = userScript;
        document.body.appendChild(s);
    });

    document.getElementById("frame-count").addEventListener("change", function(ev) {
        document.getElementById("frame-no").setAttribute("max", parseInt(ev.target.value)-1);
    });

    document.getElementById("frame-no").addEventListener("change", function() {
        for(let i=0;i<pixels.length;i++) {
            let p=pixels[i];
            [r,g,b] = compute_pixels[compute_pixels.length-1](parseInt(document.getElementById("frame-no").value), p.row, p.col);
            p.color.red = r;
            p.color.green  = g;
            p.color.blue = b;
            p.applyColor();
        }
    });

    document.getElementById("send-all").addEventListener("click",function() {
        let n_element = document.getElementById("frame-no");
        let frames = parseInt( document.getElementById("frame-count").value );
        let send_report_button = document.getElementById("output-grb");
        for(let i=0;i<frames;i++) {
            n_element.value = i;
            let change_ev = new Event("change");
            let click_ev = new Event("click")
            n_element.dispatchEvent(change_ev);
            send_report_button.dispatchEvent(click_ev);
        }
    });
} );

var compute_pixels = [function(frame,col,row) { return [0x40,0x40,0x40]}];