function main(params) {

  //[x, y, z]
  //x is depth, y is width, z is height

  var SHOW_PLANES = false;

  //size of shapes in OpenJSCAD is specified as radius, so divide everything by 2
  var box_width_radius = params.box_width/2;  
  var box_height_radius = params.box_height/2;
  var box_depth_radius = params.box_depth/2;
  // var material_thickness_radius = params.material_thickness/2;

  //create outer box
  var box = CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius]});
  box.setColor(0.5, 0, 1);

  //create and subtract inner box
  var drawer_depth = box_depth_radius - params.material_thickness/2; //how deep can drawers go
  var total_drawer_width = box_width_radius - params.material_thickness; //inside width
  var total_drawer_height = box_height_radius - params.material_thickness; //inside height

  var box_inside = CSG.cube({radius: [drawer_depth, total_drawer_width, total_drawer_height]}); //make inside box to subtract
  box_inside = box_inside.translate([params.material_thickness/2, 0, 0]); //move it so there is an open face 
  var hollow_box = box.subtract(box_inside);

  //separate hollow box into panels
  var left_box_panel = hollow_box.subtract(box.translate([0, params.material_thickness, 0])).setColor([255,0, 0]);
  var right_box_panel = hollow_box.subtract(box.translate([0, -params.material_thickness, 0])).setColor([255,255, 0]);
  var top_box_panel = hollow_box.subtract(box.translate([0, 0, -params.material_thickness])).setColor([0,255, 0]);
  var bottom_box_panel = hollow_box.subtract(box.translate([0, 0, params.material_thickness])).setColor([0,255, 255]);
  var back_box_panel = hollow_box.subtract(box.translate([params.material_thickness, 0, 0])).setColor([0,0, 255]);

  //make parallel slicing planes to cut out tabs (to subtract from each panel)
  //YZ plane (wall in front of you)
  var tab_slicing_plane_yz = CSG.cube({radius: [params.notch_width/2, box_width_radius*1.2, box_height_radius], center: [0, 0, 0]});
  var plane = tab_slicing_plane_yz;
  for(var i=1;i<(params.box_depth)/params.notch_width/4;i++) //TODO: check that these are always spaced out evenly, TODO: make sure edge tabs don't get too thin
  {
    tab_slicing_plane_yz = tab_slicing_plane_yz.union(plane.translate([i*params.notch_width*2, 0, 0]));
    tab_slicing_plane_yz = tab_slicing_plane_yz.union(plane.translate([-i*params.notch_width*2, 0, 0]));
  }
  //XZ plane (wall edge-on)
  var tab_slicing_plane_xz = CSG.cube({radius: [box_depth_radius*1.2, params.notch_width/2, box_height_radius], center: [0, 0, 0]});
  var plane = tab_slicing_plane_xz;
  for(var i=1;i<(params.box_width-params.material_thickness*2)/params.notch_width/4;i++)
  {
    tab_slicing_plane_xz = tab_slicing_plane_xz.union(plane.translate([0,i*params.notch_width*2, 0]));
    tab_slicing_plane_xz = tab_slicing_plane_xz.union(plane.translate([0,-i*params.notch_width*2, 0]));
  }
  //XY plane (parallel to the ground)
  var tab_slicing_plane_xy = CSG.cube({radius: [box_depth_radius, box_width_radius*1.2, params.notch_width/2], center: [0, 0, 0]});
  var plane = tab_slicing_plane_xy;
  for(var i=1;i<(params.box_height-params.material_thickness*2)/params.notch_width/4;i++)
  {
    tab_slicing_plane_xy = tab_slicing_plane_xy.union(plane.translate([0,0, i*params.notch_width*2]));
    tab_slicing_plane_xy = tab_slicing_plane_xy.union(plane.translate([0,0, -i*params.notch_width*2]));
  }

  //remove box we want to keep from slicing planes
  tab_slicing_plane_yz = tab_slicing_plane_yz.subtract(CSG.cube({radius: [box_depth_radius, box_width_radius-params.material_thickness, box_height_radius]}));
  tab_slicing_plane_xz = tab_slicing_plane_xz.subtract(CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius], center: [params.material_thickness, 0, 0]}));
  tab_slicing_plane_xy = tab_slicing_plane_xy.subtract(CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius], center: [params.material_thickness, 0, 0]}));
  
  //subtract finger joints from each panel
  top_box_panel = top_box_panel.subtract(tab_slicing_plane_yz);
  bottom_box_panel = bottom_box_panel.subtract(tab_slicing_plane_yz);
  left_box_panel = left_box_panel.subtract(tab_slicing_plane_xy);
  right_box_panel = right_box_panel.subtract(tab_slicing_plane_xy);
  left_box_panel = left_box_panel.subtract(top_box_panel).subtract(bottom_box_panel);
  right_box_panel = right_box_panel.subtract(top_box_panel).subtract(bottom_box_panel);
  top_box_panel = top_box_panel.subtract(tab_slicing_plane_xz);
  bottom_box_panel = bottom_box_panel.subtract(tab_slicing_plane_xz);
  back_box_panel = back_box_panel.subtract(left_box_panel).subtract(right_box_panel).subtract(top_box_panel).subtract(bottom_box_panel);

  var result;
  // result = back_box_panel.union(left_box_panel).union(right_box_panel).union(bottom_box_panel);
  
  if(params.output == "FLAT")
  {
    result = back_box_panel;
    var front_plane = CSG.Plane.fromNormalAndPoint([1,0,0], [0,0,0]);
    var front_basis = new CSG.OrthoNormalBasis(front_plane);
    var flat_back_box_panel = back_box_panel.projectToOrthoNormalBasis(front_basis);

    var ground_plane = CSG.Plane.fromNormalAndPoint([1,0,0], [0,0,0]);
    var ground_basis = new CSG.OrthoNormalBasis(ground_plane);
    var flat_left_box_panel = left_box_panel.projectToOrthoNormalBasis(front_basis);
    var flat_right_box_panel = right_box_panel.projectToOrthoNormalBasis(front_basis);

    var ground_plane = CSG.Plane.fromNormalAndPoint([0,1,0], [0,0,0]);
    var ground_basis = new CSG.OrthoNormalBasis(ground_plane);
    var flat_top_box_panel = top_box_panel.projectToOrthoNormalBasis(front_basis);
    var flat_bottom_box_panel  = bottom_box_panel.projectToOrthoNormalBasis(front_basis);
  }
  else
  {
    result = back_box_panel;
    result = result.union(left_box_panel).union(top_box_panel).union(right_box_panel).union(bottom_box_panel);
    if(SHOW_PLANES)
    {
      result = result.union(tab_slicing_plane_yz);
      result = result.union(tab_slicing_plane_xz);
      result = result.union(tab_slicing_plane_xy);
    }
    // result = result.subtract(CSG.cube({radius: [3, 2, 2]})); //for visualizing the thickness of the back panel
    result = result.translate([0, 0, box_height_radius]);
  }
  return result;
}

function flattenPanel()
{

}

function getParameterDefinitions() {
  return [
    {
      name: 'box_width', 
      type: 'float', 
      initial: 12,
      caption: "Box width (in):"
    },
    {
      name: 'box_height', 
      type: 'float', 
      initial: 8,
      caption: "Box height (in):" 
    },
    {
      name: 'box_depth', 
      type: 'float', 
      initial: 6,
      caption: "Box depth (in):" 
    },
    {
      name: 'material_thickness', 
      type: 'float', 
      initial: 0.25,
      caption: "Material thickness (in):"  //todo: need to check this isn't bigger than the box!
    },
    {
      name: 'columns', 
      type: 'float', 
      initial: 5,
      caption: "Number of columns:" 
    },
     {
      name: 'rows', 
      type: 'float', 
      initial: 3,
      caption: "Number of rows:" 
    },
    {
      name: 'notch_width', 
      type: 'float', 
      initial: 0.5,
      caption: "Notch width:" 
    },
    {
      name: 'kerf', 
      type: 'float', 
      initial: 0.01,
      caption: "Laser or CNC cutter diameter:" 
    },
    {
      name: 'drawer_style', 
      type: 'choice', 
      values: ["V", "U", "drawer pull hole", "none"],
      initial: "V",
      caption: "Drawer style:"
    },
    {
      name: 'units', 
      type: 'choice',
      caption: 'Units:',
      values: [0, 1],
      initial: 0,
      captions: ["inches", "cm"]
    },
    {
      name: 'output', 
      type: 'choice',
      caption: 'Show:',
      values: ["ASSEMBLED", "FLAT"],
      initial: "ASSEMBLED",
      captions: ["3D view (STL output)", "2D view (DXF output)"]
    }
  ];
}

  // result = box.union(box_inside);
  // var front_plane = CSG.Plane.fromNormalAndPoint([1,0,0], [0,0,0]);
  // var front_basis = new CSG.OrthoNormalBasis(front_plane);
  // result = result.projectToOrthoNormalBasis(front_basis);
  // result = result.projectToOrthoNormalBasis(CSG.OrthoNormalBasis.Z0Plane());
  //rather than pushing your object to the plane, it's returning your object as seen from that plane



  // tab_slicing_plane_yz = tab_slicing_plane_yz.translate([2*params.notch_width, params.notch_width+box_width_radius-params.material_thickness*2, 0]);

  // var right_and_top = right_box_panel.intersect(left_box_panel);

  // var slicing_planes 

  // CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius]});

  // var tab_slicing_plane_yz = CSG.cube({radius: [params.notch_width, 30, 20]}).translate([0, 30+box_width_radius-params.material_thickness*2, 0]);



  // right_box_panel.subtract(right_and_top);

// function joinWithFingerJoints(panel1, panel2)
// {




// }

//x, y, and z panels. subtract notches from grid on floor.
//drawer_height = (box_height - (2+rows-1)*material_thickness) / rows - a little bit so they aren't too squished
//drawer_width = (box_width - 2*material_thickness) / columns - a little bit so they aren't too squished
//drawer_depth = box_depth - material_thickness - a smaller bit