const keyboardConf = {
    row_count: 0,
    col_count: 0,
    layer_count: 0,
    keymap: [],
    layout: [],
    layers: [],
}

function request_layer_count() {
    nrf52_common.sendReport( [0x11,0] );
}

function request_keymap() {
    document.getElementById("in-progress").hidden = false;
    document.getElementById("finished").hidden = true;
    if( keyboardConf.col_count==0 || keyboardConf.row_count==0 ) {
        document.getElementById("info-file-button").click();
        return;
    }
    let layer_size = keyboardConf.col_count * keyboardConf.row_count * 2;
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

    setTimeout(print_keymap, keyboardConf.layer_count*reports_per_layer*100+200);
}

function load_infofile(change_ev) {
    reader = new FileReader();

    reader.addEventListener("load", (ev)=>{
        data = JSON.parse(ev.target.result);
        console.log(data);
        keyboardConf.layout = data.layouts[ Object.keys(data.layouts)[0] ].layout;
        keyboardConf.col_count = data["matrix-pins"].cols.length;
        keyboardConf.row_count = data["matrix-pins"].rows.length;
        document.getElementById("connect").removeAttribute("disabled");
    })

    file = document.getElementById("info-file-select").files[0];
    reader.readAsText(file);
}

function use_alternatives() {
    keyboardConf.col_count = parseInt( document.getElementById("col-count-input").value );
    keyboardConf.row_count = parseInt( document.getElementById("row-count-input").value );

    let layout = [];
    for(let r=0;r<keyboardConf.row_count;r++) {
        for(let c=0;c<keyboardConf.col_count;c++) {
            layout.push({"matrix": [r, c]});
        }
    }
    keyboardConf.layout = layout;

    document.getElementById("connect").removeAttribute("disabled");
}

function print_keymap() {
    let keymap = []
    let keymap_str = "";
    for(let i=0; i<keyboardConf.layer_count; i++) {
        keymap[i] = []
        for(let j=0; j<keyboardConf.row_count; j++) {
            keymap[i][j] = 0
        }
    }

    for(let l=0; l<keyboardConf.layer_count; l++) {
        for(let i=0; i<keyboardConf.layout.length; i++) {
            let row = keyboardConf.layout[i].matrix[0];
            let col = keyboardConf.layout[i].matrix[1];

            let index_base = l*keyboardConf.col_count*keyboardConf.row_count*2 + row*keyboardConf.col_count*2 + col*2;
            keymap[l][i] = keyboardConf.keymap[index_base]<<8 | keyboardConf.keymap[index_base+1];
        }
    }

    for(let l=0; l<keyboardConf.layer_count; l++) {
        let co_layer_keymap_str = "{";

        for(let i=0; i<keyboardConf.layout.length; i++) {
            if( i%keyboardConf.col_count==0 ) {
                co_layer_keymap_str += "\r\n";
            }
            co_layer_keymap_str += getKeyname(keymap[l][i]);
            co_layer_keymap_str += ", ";
        }

        co_layer_keymap_str += "\r\n}";
        keymap_str += co_layer_keymap_str + ",\r\n";
        keyboardConf.layers.push(co_layer_keymap_str);
    }

    document.getElementById("keymap-area").value = keymap_str;
    document.getElementById("copy-layer").removeAttribute("disabled");
    document.getElementById("request-keymap").hidden = false;

    document.getElementById("in-progress").hidden = true;
    document.getElementById("finished").hidden = false;
}

function print_co_layer(el) {
    let id = el.target.getAttribute("id");
    let target_id = id.replace("input", "keymap");
    let layer_num = parseInt(el.target.value);
    
    document.getElementById(target_id).innerHTML = keyboardConf.layers[layer_num].replaceAll("\r\n", "<br>");
}


function copy_layer() {
    let copy_from = parseInt( document.getElementById("input-copy-layer-from").value );
    let copy_to = parseInt( document.getElementById("input-copy-layer-to").value );

    let copy_from_offset = keyboardConf.row_count * keyboardConf.col_count * 2 * copy_from;
    let copy_to_offset = keyboardConf.row_count * keyboardConf.col_count * 2 * copy_to;

    let len = keyboardConf.row_count*keyboardConf.col_count*2;
    document.getElementById("copy-layer-finished").hidden = true;
    for(let i=0;i*28<keyboardConf.row_count*keyboardConf.col_count*2;i++) {
        let additional_offset = i*28;
        let to_offset_hi = ( (copy_to_offset + additional_offset) >> 8 ) & 0xFF;
        let to_offset_lo = ( (copy_to_offset + additional_offset) ) & 0xFF;

        let packet_size = len > 28 ? 28 : len;
        setTimeout(
            (data) => {
                nrf52_common.sendReport(data);
            },
            100*i,
            [0x13, to_offset_hi, to_offset_lo, packet_size].concat(
                keyboardConf.keymap.slice(copy_from_offset+additional_offset, copy_from_offset+additional_offset+packet_size)
            )
        );
        len -= 28;
    }
    setTimeout( ()=>{document.getElementById("copy-layer-finished").hidden=false;}, keyboardConf.row_count*keyboardConf.col_count/14*100);
}

function set_keymap(offset, data) {
    for(i=0;i<data.length/2;i++) {
        keyboardConf.keymap.splice(offset, data.length, ...data);
    }
}

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    nrf52_common.received();
    if( view[0] == 0x11 ) {
        keyboardConf.layer_count = view[1];
        console.log(view[1]);
        setTimeout(request_keymap,100);
        document.getElementById("input-copy-layer-from").setAttribute("max", view[1]-1);
        document.getElementById("input-copy-layer-to").setAttribute("max", view[1]-1);
    } else if( view[0] == 0x12) {
        let data_ary = [];
        
        let offset = view[1]<<8 | view[2];
        let size = view[3];

        for(i=4;i<size+4;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));

        set_keymap(offset, data_ary);
    }
}

function connectCallback() {
    setTimeout(request_layer_count, 100);
}

window.addEventListener("load", function() {
    document.getElementById("info-file-button").addEventListener("click", (ev)=>document.getElementById("info-file-select").click());
    document.getElementById("connect").addEventListener("click", Connect);
    document.getElementById("request-keymap").addEventListener("click", request_keymap);
    document.getElementById("info-file-select").addEventListener("change", load_infofile);
    document.getElementById("use-alternatives").addEventListener("click", use_alternatives);
    document.getElementById("copy-layer").addEventListener("click", copy_layer);
    document.getElementById("input-copy-layer-from").addEventListener("change", print_co_layer);
    document.getElementById("input-copy-layer-to").addEventListener("change", print_co_layer);
})