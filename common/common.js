NodeTools = {
    appendChildren: function(parent, ...nodes) {
        for(i=0; i<nodes.length; i++) {
            parent.append(nodes[i]);
        }
    },
}