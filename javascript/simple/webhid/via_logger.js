const keyboardConf = {
    row_count: 0,
    col_count: 0,
    layer_count: 0,
    keymap: [],
    layout: [],
    layers: [],
}

let prev_pressed = [];
let log = "";

function request_layer_count() {
    nrf52_common.sendReport( [0x11,0] );
}

function request_press() {
    nrf52_common.sendReport( [0x02,0x03] );
}

function set_keymap(offset, data) {
    for(i=0;i<data.length/2;i++) {
        keyboardConf.keymap.splice(offset, data.length, ...data);
    }
}

function put_key(row, bitmap) {
    for(let i=0;i<32;i++) {
        let mask = 1<<i;
        if( (prev_pressed[row]&mask) != (bitmap&mask) ) {
            let state = (bitmap>>i) & 1;
            if(state==1) {
                console.log("state=1");
                let keycode_offset = (keyboardConf.col_count*row+i) << 1;
                let keycode = (keyboardConf.keymap[keycode_offset]<<8) | keyboardConf.keymap[keycode_offset+1];
                let c = KEYCODES[keycode].replace("KC_", "");
                log += c;
                document.getElementById("output-area").value = log;
            }
        }
    }
    
}

function received_press(report) {
    if(! (report[0]==0x02 && report[1] == 0x03)) {
        return;
    }
    
    let press_rows=[];
    let j=2;
    for(let i=0;i<7;i++) {
        press_rows[i] = 0
        if(keyboardConf.col_count>24) {
            press_rows[i] |= report[j++]<<24;
        }

        if(keyboardConf.col_count>16) {
            press_rows[i] |= report[j++]<<16;
        }

        if(keyboardConf.col_count>8) {
            press_rows[i] |= report[j++]<<8;
        }

        press_rows[i] |= report[j++];
    }

    for(let i=0;i<7;i++) {
        if(prev_pressed[i]!=press_rows[i]) {
            put_key(i,press_rows[i]);
        }
    }
    prev_pressed = Array.from(press_rows);
}

function set_keyboard_info() {
    keyboardConf.col_count = parseInt( document.getElementById("col-count-input").value );
    keyboardConf.row_count = parseInt( document.getElementById("row-count-input").value );
    document.getElementById("connect").removeAttribute("disabled");
}


function request_keymap() {
    let layer_size = keyboardConf.col_count*keyboardConf.row_count*2;
    let reports_per_layer = Math.ceil( layer_size / 28 );
    for(let i=0;i<keyboardConf.layer_count;i++) {
        for(let j=0;j<reports_per_layer;j++) {
            let offset = layer_size*i+j*28;
            let size = layer_size - 28*j
            if( size>28 ) {
                size = 28;
            }

            setTimeout((offset1, offset2, size) => {
                nrf52_common.sendReport( [0x12, offset1, offset2, size] );
            }, (i*reports_per_layer+j)*100, offset>>8, offset&0x00FF, size);
        }
    }

    setTimeout(request_press, keyboardConf.layer_count*reports_per_layer*100+200);
}

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    nrf52_common.received();
    if( view[0] == 0x11 ) {
        keyboardConf.layer_count = view[1];
        console.log(view[1]);
        setTimeout(request_keymap,100);
    } else if( view[0] == 0x12) {
        let data_ary = [];
        
        let offset = view[1]<<8 | view[2];
        let size = view[3];

        for(i=4;i<size+4;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));

        set_keymap(offset, data_ary);
    } else if( view[0]==0x02 && view[1]==0x03 ) {
        request_press();
        received_press(view);
    }
}

function connectCallback() {
    setTimeout(request_layer_count, 100);
}

window.addEventListener("load", function() {
    document.getElementById("connect").addEventListener("click", Connect);
    document.getElementById("set-keyboard-info").addEventListener("click", set_keyboard_info);
})