
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
        if( view[1] == 0x84 ) {
            nrf52_common.col_pins = data_ary.slice();
        } else if( view[1] == 0x85 ) {
            nrf52_common.row_pins = data_ary.slice();
        } else if( view[1]== 0x86 ) {
            nrf52_common.cntr_count = view[4];
            nrf52_common.col_count = view[3];
            nrf52_common.row_count = view[2];
        }
        document.getElementById("received-rows").innerText = nrf52_common.row_pins.slice(0,nrf52_common.row_count).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols").innerText = nrf52_common.col_pins.slice(0,(nrf52_common.cntr_count?nrf52_common.cntr_count:nrf52_common.col_count)).map(c=>pinName(c)).join(",");
        document.getElementById("received-cols-count").innerText = nrf52_common.col_count;
    }
}

async function sendAdditional() {
    power_led_enable = document.getElementById("power-led-enable").checked ? 1 : 0;
    power_led_pin = parseInt(document.getElementById("power-led-pin").value);
    neopixel_pin = parseInt(document.getElementById("neopixel-pin").value);
    neopixel_count = parseInt(document.getElementById("neopixel-count").value);
    await nrf52_common.sendReport( [0x03, 0x87, 0, 0, 0, 0, power_led_enable, power_led_pin, 0, neopixel_count, neopixel_pin] );
    await nrf52_common.sendReport( [0x02, 0x87] );
}

async function send() {
    rows = document.getElementById("row-text").value.split(",").map(i=>parseInt(i));
    setTimeout(function() { nrf52_common.sendReport( [0x03, 0x85].concat(document.getElementById("row-text").value.split(",").map(i=>parseInt(i))) ); },250);
    cols = document.getElementById("col-text").value.split(",").map(i=>parseInt(i));
    setTimeout(function() { nrf52_common.sendReport( [0x03, 0x84].concat(document.getElementById("col-text").value.split(",").map(i=>parseInt(i))) ); },500);
    _row_count = parseInt( document.getElementById("row-count").value );
    _col_count = parseInt( document.getElementById("col-count").value );
    _cntr_count = parseInt( document.getElementById("cntr-count").value );
    setTimeout(function() {
    	nrf52_common.sendReport( [0x03, 0x86, 
    	parseInt( document.getElementById("row-count").value ),
        parseInt( document.getElementById("col-count").value ),
    	parseInt( document.getElementById("cntr-count").value ),
    	] ) },750);

    setTimeout(connectCallback, 1000);
}

function connectCallback() {
    nrf52_common.sendReport([0x02,0x86]);
    nrf52_common.sendReport([0x02,0x84]);
    nrf52_common.sendReport([0x02,0x85]);
}

window.addEventListener("load",()=>{
    document.getElementById("execute").addEventListener("click", Connect);
    document.getElementById("send").addEventListener("click", send);
    document.getElementById("send-additional").addEventListener("click", sendAdditional);
});
