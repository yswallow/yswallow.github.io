
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

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    if( view[0] == 0x02 ) {
        data_ary = [];
        for(i=2;i<32;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));
        if( view[1] == 0x04 ) {
            nrf52_common.col_pins = data_ary.slice();
        } else if( view[1] == 0x05 ) {
            nrf52_common.row_pins = data_ary.slice();
        } else if( view[1]== 0x06 ) {
            nrf52_common.cntr_count = view[4];
            nrf52_common.col_count = view[3];
            nrf52_common.row_count = view[2];
        }
        document.getElementById("received-rows").innerText = nrf52_common.row_pins.slice(0,nrf52_common.row_count).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols").innerText = nrf52_common.col_pins.slice(0,(nrf52_common.cntr_count?nrf52_common.cntr_count:nrf52_common.col_count)).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols-count").innerText = nrf52_common.col_count;
    }
}

async function send() {
    rows = document.getElementById("row-text").value.split(",").map(i=>parseInt(i));
    await nrf52_common.device.sendReport(0x00, new Uint8Array( [0x03, 0x05].concat(rows) ));
    cols = document.getElementById("col-text").value.split(",").map(i=>parseInt(i));
    await nrf52_common.device.sendReport(0x00, new Uint8Array( [0x03, 0x04].concat(cols) ));
    _row_count = parseInt( document.getElementById("row-count").value );
    _col_count = parseInt( document.getElementById("col-count").value );
    _cntr_count = parseInt( document.getElementById("cntr-count").value );
    await nrf52_common.device.sendReport(0x00, new Uint8Array( [0x03, 0x06, _row_count, _col_count, _cntr_count] ));

    await nrf52_common.device.sendReport(0x00, new Uint8Array([0x02,0x06]));
    await nrf52_common.device.sendReport(0x00, new Uint8Array([0x02,0x04]));
    await nrf52_common.device.sendReport(0x00, new Uint8Array([0x02,0x05]));
}
window.addEventListener("load",()=>{
    document.getElementById("execute").addEventListener("click", Connect);
    document.getElementById("send").addEventListener("click", send);
});