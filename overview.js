import {ControlHandler, FileHandler} from './update_handler.js';
import {GradientController, ColorController, PointController, LoopController,
        DataCategoryController, SliderController, RotationController,
        TimeStampController} from './controller.js';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import * as THREE from './node_modules/three/build/three.module.js';


export let Main = function (file_input, output_link, output_file_button,
                            file_display, control_display,
                            frame_slider, frame_txt,
                            color_input, gradient_inputs,
                            pt_size_input, pt_size_slider,
                            fps_input, data_category_input,
                            forward, reverse, pause,
                            video_display, picture_display, pt_display,
                            slider_div, left_slider, right_slider, left_bubble, right_bubble,
                            start_rotate, stop_rotate,
                            time_container, stamp_input, time_input, time_start, time_stop, time_reverse) {

  let scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  let camera = new THREE.PerspectiveCamera( 50,
  	window.innerWidth / window.innerHeight / 2, 0.1, 1000 );
  camera.position.z = 100;

  let ambient_light = new THREE.AmbientLight( 0xffffff );
  scene.add( ambient_light );

  let renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth / 2, window.innerHeight );

  document.getElementById('scene').appendChild( renderer.domElement );

  let orbit_controls = new OrbitControls( camera, renderer.domElement );

  let vertex_data = new Object();

  let file_handler = new FileHandler(scene, vertex_data, file_input,
                                     output_link, output_file_button,
                                     pt_display);

  let control_handler = new ControlHandler();

  let color_control = null;
  let point_control = null;
  let loop_control = null;
  let data_control = null;
  let slider_control = null;
  let gradient_control = null;
  let rotate_control = null;
  let time_control = null;

  let animate = function () {

    requestAnimationFrame(animate);

    orbit_controls.update();

    if(!file_handler.all_loaded() && !control_handler.all_loaded()) {
      file_handler.load_files();
    }

    else if(file_handler.all_loaded() && !control_handler.all_loaded()) {
      color_control = new ColorController(frame_slider, frame_txt,
                                          file_handler.get_color_attribute(),
                                          file_handler.get_alpha_attribute(),
                                          vertex_data.frames,
                                          vertex_data.frames_per_pt,
                                          control_handler);

      loop_control = new LoopController(fps_input, frame_slider, frame_txt,
                                        forward, reverse, pause,
                                        control_handler);

      data_control = new DataCategoryController(vertex_data, data_category_input,
                                                video_display, picture_display,
                                                control_handler);

      slider_control = new SliderController(slider_div, left_slider, right_slider,
                                            left_bubble, right_bubble,
                                            control_handler);

      gradient_control = new GradientController(color_input, gradient_inputs, control_handler);

      rotate_control = new RotationController(file_handler.get_object_rotation(),
                                              start_rotate, stop_rotate, control_handler);

      time_control = new TimeStampController(time_container,
                                             stamp_input, time_input, frame_slider,
                                             time_start, time_stop, time_reverse,
                                             control_handler);

      if(!file_handler.is_stl()) {
        point_control = new PointController(file_handler.get_point_size(),
                                            pt_size_input, pt_size_slider,
                                            control_handler);
      }

      control_display.style.display = 'block';
      file_display.style.display = 'none';

    }

    else {
      control_handler.update_controls();
    }

    renderer.render( scene, camera );

  }

  window.addEventListener('resize', on_window_resize);

  animate();

  function on_window_resize() {
    camera.aspect = window.innerWidth / window.innerHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth / 2, window.innerHeight );
    control_handler.adjust_extrema();
  }

}
