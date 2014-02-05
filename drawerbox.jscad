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
      initial: 1,
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
      initial: 0.25,
      caption: "Notch width:" 
    },
    {
      name: 'kerf', 
      type: 'float', 
      initial: 0.01,
      caption: "Kerf width:" 
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
    }
  ];
}

function main(params) {
  var result;
  var box_width_radius = params.box_width/2;  //size specified as radius, so we need to divide by 2
  var box_height_radius = params.box_height/2;
  var box_depth_radius = params.box_depth/2;

  var box = CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius]}); //create outer box
  box.setColor(0.5, 0, 1);

  var drawer_depth = box_depth_radius - params.material_thickness;
  var total_drawer_width = box_width_radius - 2*params.material_thickness; //inside dimensions
  var total_drawer_height = box_height_radius - 2*params.material_thickness; //
  // var box_inside = CSG.cube({radius: 10});
  var box_inside = CSG.cube({radius: [drawer_depth, total_drawer_width, total_drawer_height]});
  // box_inside.translate(-2*params.material_thickness);
  box_inside = box_inside.translate([params.material_thickness, 0, 0]);
  small_box = CSG.cube({radius: [30, 3, 3]}); //.subtract(small_box)
  var hollow_box = box.subtract(box_inside);
  result = hollow_box;
  // result = box.union(box_inside);
  // var front_plane = CSG.Plane.fromNormalAndPoint([1,0,0], [0,0,0]);
  // var front_basis = new CSG.OrthoNormalBasis(front_plane);
  // result = result.projectToOrthoNormalBasis(front_basis);
  // result = result.projectToOrthoNormalBasis(CSG.OrthoNormalBasis.Z0Plane());
  //rather than pushing your object to the plane, it's returning your object as seen from that plane
  var left_box_panel = hollow_box.subtract(box.translate([0, params.material_thickness*2, 0])).setColor([255,0, 0]);
  var right_box_panel = hollow_box.subtract(box.translate([0, -params.material_thickness*2, 0])).setColor([255,255, 0]);
  var top_box_panel = hollow_box.subtract(box.translate([0, 0, -params.material_thickness*2])).setColor([0,255, 0]);
  var bottom_box_panel = hollow_box.subtract(box.translate([0, 0, params.material_thickness*2])).setColor([0,255, 255]);
  var back_box_panel = hollow_box.subtract(box.translate([params.material_thickness*2, 0, 0])).setColor([0,0, 255]);

  var right_and_top = right_box_panel.intersect(left_box_panel);

  // var slicing_planes 

  //make a bounding box for teh big planes zoom

  // CSG.cube({radius: [box_depth_radius, box_width_radius, box_height_radius]});

  // var tab_slicing_plane_yz = CSG.cube({radius: [params.notch_width, 30, 20]}).translate([0, 30+box_width_radius-params.material_thickness*2, 0]);

  var tab_slicing_plane_yz = CSG.cube();

  for(var i=0;i<box_depth_radius/params.notch_width/2;i++)
  {
        tab_slicing_plane_yz = tab_slicing_plane_yz.union(CSG.cube({radius: [params.notch_width, 30, 20]}).translate([2*i*params.notch_width*2, 30+box_width_radius-params.material_thickness*2, 0]));

  //   //then make a gimongous set of planes to slice with chop chop

  }

  right_box_panel.subtract(right_and_top);

  top_box_panel = top_box_panel.subtract(tab_slicing_plane_yz);

  result = back_box_panel.union(left_box_panel).union(top_box_panel).union(right_box_panel).union(bottom_box_panel);
  result = result.union(tab_slicing_plane_yz);
  result = result.translate([0, 0, box_height_radius]);
  return result;
}

function joinWithFingerJoints(panel1, panel2)
{




}

//x, y, and z panels. subtract notches from grid on floor.
//drawer_height = (box_height - (2+rows-1)*material_thickness) / rows - a little bit so they aren't too squished
//drawer_width = (box_width - 2*material_thickness) / columns - a little bit so they aren't too squished
//drawer_depth = box_depth - material_thickness - a smaller bit