import {GeometryParser, TempParser, OutputWriter} from './readers.js';

export class ControlHandler {
  constructor() {
    let control_list = [];

    this.all_loaded = function () {
      return control_list.length;
    }

    this.add = function (controller) {
      control_list.push(controller);
      console.log(control_list);
    };

    this.update_controls = function () {
      for(let control = 0; control < control_list.length; ++control) {
        control_list[control].check_update();
      }
    };

    this.adjust_extrema = function (min, max) {
      if(min == null || max == null) { return; }

      for(let control = 0; control < control_list.length; ++control) {
        if('new_extrema' in control_list[control]) {
          control_list[control].new_extrema(min, max);
        }
      }

    };

    this.adjust_data = function (display_data, frame_count) {
      if(display_data == null || frame_count == null) { return; }

      for(let control = 0; control < control_list.length; ++control) {
        if('new_data' in control_list[control]) {
          control_list[control].new_data(display_data, frame_count);
        }
      }
    };

    this.pause = function() {
      for(let control = 0; control < control_list.length; ++control) {
        if('pause' in control_list[control]) {
          control_list[control].pause();
        }
      }
    };

    this.adjust_gradient = function (hex_color_array) {
      for(let control = 0; control < control_list.length; ++control) {
        if('new_gradient' in control_list[control]) {
          control_list[control].new_gradient(hex_color_array);
        }
      }
    };
  }
};

export class FileHandler {
  constructor(scene, vertex_data,
              file_input,
              output_link, output_file_button,
              pt_display) {

    let object = new Object();
    let color = new Object();
    let position = new Object();
    let alpha = new Object();

    let geo_reader = new Object();
    let temp_reader = new Object();
    let output_writer = new Object();

    geo_reader.parser = new GeometryParser(scene, vertex_data,
                                           object, color, position, alpha,
                                           temp_reader, output_writer,
                                           output_link);
    temp_reader.parser = null;
    output_writer.parser = null;

    let processed = new Set();

    let geo_exts = ['stl', 'pt'];
    let temp_exts = ['temp'];

    this.load_files = function () {
      for(let i = 0; i < file_input.files.length; ++i) {
        if(!file_input.files[i] || processed.has(file_input.files[i])) {continue;}

        let exts = get_exts(file_input.files[i].name);

        for(let ext = 0; ext < exts.length; ++ext) {
          if(temp_reader.parser == null && geo_exts.includes(exts[ext])) {

            adjust_stl(exts[ext]);

            geo_reader.parser.readAsArrayBuffer(file_input.files[i]);

            processed.add(file_input.files[i]);

          }
          else if(temp_reader.parser != null && temp_exts.includes(exts[ext])) {

            temp_reader.parser.readAsArrayBuffer(file_input.files[i]);

            processed.add(file_input.files[i]);

          }
        }
      }
    };

    function adjust_stl(ext) {
      if(ext == 'stl') {
        geo_reader.parser.is_stl = true;
        pt_display.style.display = 'none';
      }
      else {
        geo_reader.parser.is_stl = false;
        pt_display.style.display = 'block';
      }
    };

    this.is_stl = function () {
      return geo_reader.parser._is_stl;
    };

    this.all_loaded = function () {
      return (output_writer.writer != null);
    };

    output_file_button.onclick = function () {
      output_file();
    };

    function output_file () {
      if(!(temp_reader.loaded != null &&
          output_writer.loaded != null)) {alert('Load Geometry and Temperature Files First.');}
      else {
        output_link.href = output_writer.writer.generate_link();
        output_link.style.display = 'block';
        output_link.download = 'output.txt';
      }
    };

    this.get_color_attribute = function () {
      return color.attribute;
    }

    this.get_position_attribute = function () {
      return position.attribute;
    }

    this.get_alpha_attribute = function () {
      return alpha.attribute;
    }

    this.get_point_size = function () {
      return object.material.uniforms.pt_size;
    }

    this.get_object_rotation = function () {
      return scene.children[1].rotation;
    }

    function get_exts(filename) {
			let exts = filename.split('.');
			exts.shift();
			return exts;
		};
  }
}
