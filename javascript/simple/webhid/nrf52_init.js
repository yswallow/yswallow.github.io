var device;
var col_count=0, row_count=0, cntr_count=0, col_pins=[], row_pins=[];
var heatmap = [];
function two_digit_dec(num) {
    c = num.toString();
    if( c.length==1 ) {
        c = "0"+c;
    }
    return c;
}

function pinName(num) {
    return `P${parseInt(num/32)}_`+two_digit_dec(num%32);
}

function request_heatmap() {
    for(i=0;i<row_count;i++) {
        device.sendReport(0x00, new Uint8Array([0x02,0x80,i,0]));
        if(col_count>13) {
            device.sendReport(0x00, new Uint8Array([0x02,0x80,i,1]));
        }
    }
}
function print_heatmap() {
    result = [];
    for(i=0;i<row_count;i++) {
        if(heatmap[2*i]) {
            col = heatmap[2*i] ? heatmap[2*i].concat(heatmap[2*i+1]) : heatmap[2*i];
            sum = [];
            for(j=0;j<col_count;j++) {
                sum[j] = col[2*j]+(col[2*j+1]<<8);
            }
            result[i] = sum.join(",");
        }
    }
    document.getElementById("heatmap-area").innerHTML = result.join("<br>");
}

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    if( view[0] == 0x02 ) {
        data_ary = [];
        for(i=2;i<32;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));
        if( view[1] == 0x04 ) {
            col_pins = data_ary.slice();
        } else if( view[1] == 0x05 ) {
            row_pins = data_ary.slice();
        } else if( view[1]== 0x06 ) {
            cntr_count = view[4];
            col_count = view[3];
            row_count = view[2];
        } else if(view[1]==0x80) {
            row2 = view[2]*2+view[3];
            heatmap[row2] = data_ary.slice(2);
            print_heatmap();
            return;
        }
        document.getElementById("received-rows").innerText = row_pins.slice(0,row_count).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols").innerText = col_pins.slice(0,(cntr_count?cntr_count:col_count)).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols-count").innerText = col_count;
    }
}
async function Connect(){
    if("hid" in navigator) {
        console.log("WebHID API available.");
        
        navigator.hid.addEventListener('connect', ({device}) => {
            console.log(`HID connected: ${device.productName}`);
        });
        const filters = [
            {
                
            }
        ];
        [device] = await navigator.hid.requestDevice({ filters });
        
        device.addEventListener("inputreport", parseHidResponse);

	    console.log(`productName: ${device.productName}`); 
        for (let collection of device.collections) {
            console.log(`Usage: ${collection.usage}`);
            console.log(`UsagePage: ${collection.usagePage}`);
            for (let inputReport of collection.inputReports) {
                console.log(`Input report: ${inputReport.reportId}`);
                // Loop through inputReport.items
            }

            for (let outputReport of collection.outputReports) {
                console.log(`Output report: ${outputReport.reportId}`);
            // Loop through outputReport.items
            }

            for (let featureReport of collection.featureReports) {
                console.log(`Feature report: ${featureReport.reportId}`);
            // Loop through featureReport.items
            }

            // Loop through subcollections with collection.children
        }
        if(! device.opened) {
            await device.open();
            console.log( device );
        }
        device.sendReport(0x00, new Uint8Array([0x02,0x06]));
        device.sendReport(0x00, new Uint8Array([0x02,0x04]));
        device.sendReport(0x00, new Uint8Array([0x02,0x05]));
        
    } else {
        alert("WebHID API not available.");
    }
}
async function send() {
    rows = document.getElementById("row-text").value.split(",").map(i=>parseInt(i));
    await device.sendReport(0x00, new Uint8Array( [0x03, 0x05].concat(rows) ));
    cols = document.getElementById("col-text").value.split(",").map(i=>parseInt(i));
    await device.sendReport(0x00, new Uint8Array( [0x03, 0x04].concat(cols) ));
    _row_count = parseInt( document.getElementById("row-count").value );
    _col_count = parseInt( document.getElementById("col-count").value );
    _cntr_count = parseInt( document.getElementById("cntr-count").value );
    await device.sendReport(0x00, new Uint8Array( [0x03, 0x06, _row_count, _col_count, _cntr_count] ));

    await device.sendReport(0x00, new Uint8Array([0x02,0x06]));
    await device.sendReport(0x00, new Uint8Array([0x02,0x04]));
    await device.sendReport(0x00, new Uint8Array([0x02,0x05]));
}
window.addEventListener("load",()=>{
    document.getElementById("execute").addEventListener("click", Connect);
    document.getElementById("send").addEventListener("click", send);
    document.getElementById("get-heatmap").addEventListener("click", request_heatmap);
});