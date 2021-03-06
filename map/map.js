var WORLD50JSON = "world-50m.json";
var WORLD110JSON = "world-110m.json";
var COUNTRYCODESJSON = "countryCodes.json";

var width = 1000;
var height = 625;
var scale0 = (width - 1) / 2 / Math.PI;
var YEAR = 0;
var countryCodes = {};

var projection = d3.geo.equirectangular()
    .scale(150)
    .translate([width / 2, height / 2]);

var zoom = d3.behavior.zoom()
  .translate([width / 2, height / 2])
  .scale(scale0)
  .scaleExtent([scale0, 8 * scale0])
  .on("zoom", zoomed);

var path = d3.geo.path().projection(projection);

var svg = d3.select("body").select("#maincontent").append("svg")
  .attr("width", width)
  .attr("height", height);

var g = svg.append("g");

var clipPath = svg.append("defs").append("svg:clipPath")
  .attr("id", "clip");
var imagePath = svg.append("g")
  .attr("clip-path", "url(#clip)");



var tooltip = d3.select("body").select("#maincontent")
  .append("div").attr("class", "tooltip hidden");

svg
  .call(zoom)
  .call(zoom.event);

d3.json(WORLD110JSON, function(error, world) {
  if (error) return console.error(error);

  g.selectAll(".country")
    .data(topojson.feature(world, world.objects.countries).features)
  .enter().insert("path")
    .attr("class", function(d) { return "country" })
    .attr("id", function(d) {return "country_" + d.id})
    .attr("d", path)
    .style({
      "visibility": 
      function(d) {
        if(d.id == 10) {
          return "hidden";
        }
        return 
          "visible";
      },
      "stroke-width": "1px"
      });

  g.selectAll(".country")
    .on("click", handleClick)
    .on("mousemove", function(d, i) {
      var mouse = d3.mouse(svg.node()).map(function(d){return parseInt(d);});
      tooltip.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+5)+"px;top:"+(mouse[1]+30)+"px")
        .html(countryCodeToName(""+d.id))
    })
    .on("mouseout", function(d, i) {
      tooltip.classed("hidden", true);
    });

  groupStyle(PersonstoCountryCodes(PEOPLE), "opacity", "1");
});

// unpack country codes:
d3.json(COUNTRYCODESJSON, function(error, json) {
  if (error) return console.error(error);
  countryCodes = json;
});

function zoomed() {
  projection
    .translate(zoom.translate())
    .scale(zoom.scale());

  g.selectAll("path")
    .attr("d", path);

  // adjust images
  // clipPath.selectAll("circle")
  //   .attr("cx", function() {
  //     return projection
  //       .translate(zoom.translate())
  //       .scale(zoom.scale());
  //   })
  // imagePath.selectAll("image")
  //   .translate(zoom.translate())
  //   .scale(zoom.scale());
}


// show the leader's images on clicks
function handleClick (d, i) {
  d3.select(".selected").classed("selected", false);
  d3.select("#country_" + d.id).classed("selected", true);

  var persons = countryCodeToPersons(d.id);

  var mouse = d3.mouse(svg.node()).map(function(d){return parseInt(d);});
  var countryCenter = [mouse[0], mouse[1]];

  // setting up clipPaths
  clipPath.selectAll("circle")
    .data([])
  .exit().remove();

  clipPath.selectAll("circle")
    .data(persons)
  .enter().append("circle")
    .attr("id", function(d, i) {return "circle_" + i;})
    .attr("cx", countryCenter[0])
    .attr("cy", countryCenter[1])
    .attr("r", 2)
  .transition().duration(500)
    .attr("cx", function(d, i) {
      var ratio = 2 * i * Math.PI / persons.length;
      return Math.sin(ratio) * 50 + countryCenter[0] + 7;
    })
    .attr("cy", function(d, i) {
      var ratio = 2 * i * Math.PI / persons.length;
      return -1*Math.cos(ratio) * 50 + countryCenter[1] + 10;
    })
    .attr("r", 28);

  imagePath.selectAll("image")
    .data([])
  .exit().remove();

  imagePath.selectAll("image")
    .data(persons)
  .enter().append("image")
    .on("click", function(d, i) {
      // remove possible old info box:
      if(d3.select("#image_" + i).attr("x") === "0"){
        d3.select(".infobox").remove();
        d3.select("#image_" + i).remove();
        return;
      }
      d3.select("#image_" + i).transition().duration(500)
        .attr("x", 0)
        .attr("y", 0);
      d3.select("#circle_" + i).transition().duration(500)
        .attr("cx", 38)
        .attr("cy", 31);
      displayInfo(d);
    })
    .attr("id", function(d, i) {return "image_" + i;})
    .attr("xlink:href", function(d, i) {return d.image;})
    .attr("x", countryCenter[0])
    .attr("y", countryCenter[1])
    .attr("width", 2)
    .attr("height", 2)
    .attr("class", "person")
  .transition().duration(500)
    .attr("x", function(d, i) {
      var ratio = 2 * i * Math.PI / persons.length;
      return Math.sin(ratio) * 50 + countryCenter[0] - 30;
    })
    .attr("y", function(d, i) {
      var ratio = 2 * i * Math.PI / persons.length;
      return -1*Math.cos(ratio) * 50 + countryCenter[1] - 20;
    })
    .attr("width", 80)
    .attr("height", 80);  

}

////////////////////////////////////////////////////////////////////////////
// conversion between country names and codes

function countryToCode(country) {
  for (var i = 0, obj; obj = countryCodes[i]; i++) {
    if (obj.name === country) {
      return obj.countryCode;
    }
  }
  return "";
}
function countryCodeToName(code) {
  code = "" + code; // convert to string just in case
  for (var i = 0, obj; obj = countryCodes[i]; i++) {
    if (obj.countryCode === code) {
      return obj.name;
    }
  }
  return "";
}

function countriesToCodes(countries) {
  var codes = [];
  for (var i = 0, country; country = countries[i]; i++) {
    codes.push(countryToCode(country));
  }
  return codes;
}
function countryCodesToNames(codes) {
  var names = [];
  for (var i = 0, code; code = codes[i]; i++) {
    names.push(countryCodeToName(code));
  }
  return names;
}

//convert between country code and Person
function countryCodeToPersons(code) {
  var countryName = countryCodeToName(code);
  var persons = [];
  for (var i = 0, person; person = PEOPLE[i]; i++) {
    if (person.country === countryName) {
      persons.push(person);
    }
  }
  return persons;
}
function PersonstoCountryCodes(people) {
  var codes = [];
  for (var i = 0, person; person = people[i]; i++) {
    codes.push(countryToCode(person.country));
  }
  return codes;
}

////////////////////////////////////////////////////////////////////////////

function Person(name, country, image, pdfs) {
  this.name = name;
  this.country = country;
  this.image = image;
  this.information = pdfs;
}

function groupStyle(codes, prop, detail) {
  for (var i = 0, d; d = codes[i]; i++) {
    g.select("#country_" + d).style(prop, detail);
  }
}

var PEOPLE = [
  new Person("Che Guevara", "Cuba", "Che.jpeg", ["CheGuevara.pdf"]),
  new Person("Zhou Enlai", "China", "zhouenlai.jpeg", []),
  new Person("Lin Biao", "China", "linbiao.jpeg", []),
  new Person("Mao Zedong", "China", "mao.jpeg", []),
  new Person("Sukarno", "Indonesia", "sukarno.jpeg", []),
  new Person("Kwame Nkrumah", "Ghana", "kwame.jpeg", []),
  new Person("Julius Nyerere", "Tanzania", "nyerere.jpeg", []),
  new Person("Gamal Abdel Nasser", "Egypt", "nasser.jpeg", ["Nassernonalignment.pdf", "NasserPhilosophyofRevolution.pdf"]),
  new Person("Amilcar Cabral", "Guinea-Bissau", "cabral.jpeg", []),
  new Person("Josep Broz Tito", "Slovenia", "tito.jpeg", []),
  new Person("Josep Broz Tito", "Serbia", "tito.jpeg", []),
  new Person("Josep Broz Tito", "Montenegro", "tito.jpeg", []),
  new Person("Josep Broz Tito", "Bosnia and Herzegovina", "tito.jpeg", []),
  new Person("Jawaharlal Nehru", "India", "nehru.jpeg", []),
  new Person("Fidel Castro", "Cuba", "fidel.jpeg", [])
  // new Person("Sun Yat-Sen", "China", "yatsen.jpeg", [])
  // new Person("Walt Whitman Rostow", "United States", "rostow.jpeg", []),
  // new Person("John Lewis Gaddis", "United States", "gaddis.jpeg", [])
];

function displayInfo(person) {
  console.log("displaying info on: " + person.name);
  var infobox = d3.select("body").select("#maincontent").append("div");
  var xpos = 10;
  var ypos = 132;
  infobox
    .attr("class", "infobox")
    .style("left", xpos + "px")
    .style("top", ypos + "px")
    .style("width", "2px")
    .style("height", "2px")
    .transition().delay(500).duration(500)
      .style("width", "" + (width - 2*xpos) + "px")
      .style("height", "" + (height - ypos/2) + "px");

  infobox
    .append("center").append("h1").html(person.name);

  for(var i = 0, pdf; pdf = person.information[i]; i++) {
    var pdfWidth = ((width-2*xpos) / person.information.length) - 20;
    infobox
      .append("iframe")
      .attr("src", pdf)
      .attr("width", pdfWidth + "px")
      .attr("height", "" + (height - ypos) + "px")
      .style("left", "" + (i * pdfWidth + 10) + "px");
  }
}





















