Packer = function(w, h) {
  this.init(w, h);
};

Packer.prototype = {

  init: function(w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
  },

  fit: function(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (node = this.findNode(this.root, block.w, block.h)) {
        block.fit = this.splitNode(node, block.w, block.h);
      }
    }
  },

  findNode: function(root, w, h) {
    if (root.used)
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    else if ((w <= root.w) && (h <= root.h))
      return root;
    else
      return null;
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  }
}

Demo = {

  init: function() {

    Demo.el = {
      canvas:   $('#canvas')[0],
    };

    Demo.colors = ["cornsilk", "crimson", "cyan", "darkcyan", 
      "mintcream", "mistyrose", "moccasin", "navajowhite", 
      "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", 
      "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink"];
    Demo.unit    = 50;
    Demo.gridX   = 5;
    Demo.gridY   = 3;
    Demo.padding = 5;

    if (!Demo.el.canvas.getContext) // no support for canvas
      return false;

    Demo.el.draw = Demo.el.canvas.getContext("2d");
    Demo.run();
  },

  //---------------------------------------------------------------------------

  run: function() {
    Demo.canvas.reset(Demo.padding + Demo.gridY*Demo.gridX*(2*Demo.unit+Demo.padding), 960);


    blocks = Demo.blocks.makeList(Demo.gridX*Demo.gridY);

    xOffset = Demo.padding;

    yOffset = Demo.padding + 20;
    Demo.canvas.textFont("bold 18px sans-serif");
    Demo.canvas.textColor("black");
    Demo.canvas.text("Original Data", 5 , yOffset);
    yOffset += Demo.padding;

    Demo.canvas.showList('natural', xOffset, yOffset, Demo.padding, blocks);

    for (i=0;i<blocks.length;i++) {
      blocks[i].w = Demo.unit;
      blocks[i].h = Demo.unit;
      blocks[i].current = '1';
    }
    yOffset += Demo.padding + 2*Demo.unit;


    // This list is optimized to give the biggest elements the change
    // to be their biggest.  It will fit in the given grid
    //
    // The problem is to pack this list, in best natural order, i.e.
    // from left to right, as best as possible by block.label
    blocks = Demo.blocks.fitList(blocks);


    yOffset += Demo.padding + 20;
    Demo.canvas.textFont("bold 18px sans-serif");
    Demo.canvas.textColor("black");
    Demo.canvas.text("Best size", 5 , yOffset);
    yOffset += Demo.padding;

    Demo.canvas.showList('current', xOffset, yOffset, Demo.padding, blocks);

    //Sort them by size.
    blocks = blocks.sort(function(a,b) {return (a.current < b.current ? 1 : ((b.current < a.current ? -1 : 0)));});

    large = [];
    med   = [];
    small = [];
    final = [];
    for (i=0; i < blocks.length; i++) {
      block = blocks[i];
      if (block.current === "3") {
        large.push(block);
      }
      else if (block.current === "2") {
        med.push(block);
      }
      else {
        small.push(block);
      }
    }

    // Sort by label within each set.
    large = large.sort(function(a,b) {return (a.label > b.label ? 1 : ((b.label > a.label ? -1 : 0)));});
    med   = med.sort(function(a,b) {return (a.label > b.label ? 1 : ((b.label > a.label ? -1 : 0)));});
    small = small.sort(function(a,b) {return (a.label > b.label ? 1 : ((b.label > a.label ? -1 : 0)));});

    final = final.concat(large, med, small);

    yOffset += Demo.padding + 2*Demo.unit;
    yOffset += Demo.padding + 20;
    Demo.canvas.textFont("bold 18px sans-serif");
    Demo.canvas.textColor("black");
    Demo.canvas.text("Packed via biggest first", 5 , yOffset);
    yOffset += Demo.padding;
    //Demo.canvas.showList('current', xOffset, yOffset, Demo.padding, final);

    Demo.canvas.drawGrid(5, yOffset, Demo.gridX, Demo.gridY);

    var packer = new Packer(Demo.gridX*Demo.unit, Demo.gridY*Demo.unit);
    packer.fit(final);

    for(var n = 0 ; n < final.length ; n++) {
      var block = final[n];
      if (block.fit) {
       Demo.canvas.rect(5 + block.fit.x, yOffset + block.fit.y, block.w, block.h, block.color);
       Demo.canvas.textFont("bold 18px sans-serif");
       Demo.canvas.textColor("black");
       blah = Demo.canvas.textSize(block.label);
       Demo.canvas.text(block.label, 5 + block.fit.x + (block.w - blah.width)/2, yOffset + block.fit.y  + (block.h + 18)/2);
       Demo.canvas.stroke(5 + block.fit.x, yOffset + block.fit.y, block.w, block.h);
      }
    }
  },

  //---------------------------------------------------------------------------


  blocks: {
    makeList: function(count) {
      var stream = [];
      things = ["1", "2", "3"];
      for (i=0;i<count;i++) {
        x = Math.floor(Math.random()*3);

        size = things[x];
        w = Demo.unit;
        h = Demo.unit;
       
        if (size === "2") {
          w = 2 * Demo.unit;
        }

        if (size === "3") {
          w = 2 * Demo.unit;
          h = 2 * Demo.unit;
        }
 
        stream.push({
          natural: size,
          w: w,
          h: h,
          current: size,
          upsized: false,
          label: i + 1,
          color: Demo.colors[i%Demo.colors.length]
        });
      }
      return stream;
    },

    fitList: function(list) {
      largeSlots = Math.floor(Demo.gridX/2)*Math.floor(Demo.gridY/2);
      medSlots = Demo.gridY*Math.floor(Demo.gridX/2);
      numLarge = numMed = i = 0;
      // Upsize possilbe larges to large
      while (i < list.length && !list[list.length - 1].upsized) {
        if (largeSlots - numLarge && list[i].natural === '3' && i + 3 < list.length) {
          list[i].current = '3';
          list[i].w = 2*Demo.unit;
          list[i].h = 2*Demo.unit;
          list[i].upsized = true;
          list = list.splice(0, list.length -3, list);
          numLarge++;
          medSlots -= 2;
        }
        else if (medSlots - numMed && list[i].natural === '3' && i + 1 < list.length) {
          list[i].current = '2';
          list[i].upsized = true;
          list[i].w = 2*Demo.unit;
          list = list.splice(0, list.length - 1, list);
          numMed++;
        }
        i++;
      }

      // Upsize possible mediums to medium
      i = 0; 
      while (medSlots - numMed && i < list.length && !list[list.length - 1].upsized) {
        if (list[i].natural === '2' && i + 1 < list.length) {
          list[i].current = '2';
          list[i].upsized = true;
          list[i].w = 2*Demo.unit;
          list = list.splice(0, list.length - 1, list);
          numMed++;
        }
        i++;
      }
      return list;
    },
  }, 

  canvas: {
    reset: function(width, height) {
      Demo.el.canvas.width  = width  + 1; // add 1 because we draw boundaries offset by 0.5 in order to pixel align and get crisp boundaries
      Demo.el.canvas.height = height + 1; // (ditto)
      Demo.el.draw.clearRect(0, 0, Demo.el.canvas.width, Demo.el.canvas.height);
    },

    rect:  function(x, y, w, h, color) {
      Demo.el.draw.fillStyle = color;
      Demo.el.draw.fillRect(x + 0.5, y + 0.5, w, h);
    },

    stroke: function(x, y, w, h) {
      Demo.el.draw.strokeRect(x + 0.5, y + 0.5, w, h);
    },

    text: function(string, x, y) {
      Demo.el.draw.fillText(string, x, y);
    },

    textFont: function(font) {
      Demo.el.draw.font = font;
    },

    textColor: function(color) {
      Demo.el.draw.fillStyle = color;
    },
    textSize: function(text) {
      return Demo.el.draw.measureText(text);
    },

    drawGrid: function(xOffset, yOffset, cols, rows) {
      for (y = 0; y < rows; y++) {
        for (x = 0; x < cols; x++) {
          Demo.canvas.stroke(xOffset + x*Demo.unit, yOffset + y*Demo.unit, Demo.unit, Demo.unit);
        }
      }
    },

    showList: function(type, xOffset, yOffset, padding, list) {
      start = xOffset;
        for (i=0; i < list.length; i++) {
          block = list[i];
          Demo.canvas.rect(start, yOffset, block.w, block.h, block.color);
          Demo.canvas.textFont("bold 18px sans-serif");
          Demo.canvas.textColor("black");
          blah = Demo.canvas.textSize(block.label);
          Demo.canvas.text(block.label, start + (block.w - blah.width)/2, yOffset + block.h/2 + 9);
          Demo.canvas.stroke(start, yOffset, block.w, block.h);
          start += (padding + block.w);
      }
    },

    boundary: function(node) {
      if (node) {
        Demo.canvas.stroke(node.x, node.y, node.w, node.h);
        Demo.canvas.boundary(node.down);
        Demo.canvas.boundary(node.right);
      }
    }
  },

}

$(Demo.init);

