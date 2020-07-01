export class GradientController {
  constructor(color_scheme_input, gradient_inputs, control_handler) {

    control_handler.add(this);

    let scheme_to_hex = new Map([
			['Blue Green Red', ['#0000ff', '#00ff00', '#ff0000']],
			['Yellow Orange Red', ['#ffeda0', '#feb24c', '#f03b20']],
			['Yellow Green Blue', ['#edf8b1', '#7fcdbb', '#2c7fb8']],
			['Grey', ['#f0f0f0','#bdbdbd','#636363']],
			['Purple Red', ['#e7e1ef', '#c994c7', '#dd1c77']],
		]);

    let curr_scheme = 'Blue Green Red';

    let color_gradient_hex = ['#0000ff', '#00ff00', '#ff0000'];
    for(let i = 0; i < 3; ++i) {
      gradient_inputs[i].value = color_gradient_hex[i];
      gradient_inputs[i].style.width = `${60}`;
    }

    this.check_update = function () {
      if(!gradient_inputs[0].oninput && !gradient_inputs[1].oninput
        && !gradient_inputs[2].oninput) {

        if(gradient_inputs[0].value != color_gradient_hex[0] ||
          gradient_inputs[1].value != color_gradient_hex[1] ||
          gradient_inputs[2].value != color_gradient_hex[2]) {

          color_gradient_hex[0] = gradient_inputs[0].value;
          color_gradient_hex[1] = gradient_inputs[1].value;
          color_gradient_hex[2] = gradient_inputs[2].value;

          export_gradient();

        }

      }

      if(curr_scheme != color_scheme_input.value
        && scheme_to_hex.has(color_scheme_input.value)) {

        curr_scheme = color_scheme_input.value;
        color_gradient_hex = scheme_to_hex.get(curr_scheme);

        gradient_inputs[0].value = color_gradient_hex[0];
        gradient_inputs[1].value = color_gradient_hex[1];
        gradient_inputs[2].value = color_gradient_hex[2];

        export_gradient();

      }

    }

    function export_gradient () {
      control_handler.adjust_gradient(color_gradient_hex);
    };

  }

}

export class ColorController {
  constructor(frame_slider, frame_txt,
              color_attribute, alpha_attribute,
              coloring_data, frame_count, control_handler) {

    control_handler.add(this);

    let pt_colors = color_attribute.array;
    let pt_alphas = alpha_attribute.array;
    let temp_data = coloring_data;

    let real_min = Infinity;
    let real_max = -Infinity;
    let norm_constant = 1;

    let color_min = Infinity;
    let color_max = -Infinity;
    let color_gradient_rgb = [[0,0,1], [0,1,0],[1,0,0]];

    let curr_frame = 0;
    let num_frames = frame_count;

    frame_slider.min = 0;
    frame_slider.value = 0;
    frame_slider.max = frame_count - 1;

    let max_num_width = 10*(frame_slider.max.length);
    let offset = (100*max_num_width/window.innerHeight);

    frame_txt.value = 0;
    frame_txt.style.width = `${max_num_width}px`;
    frame_txt.style.left = `${1.25 - offset}%`;

    init_norm_constant();

    this.check_update = function () {
      if(frame_txt.oninput || num_frames <= 1) { return; }

      let slider_val = Number(frame_slider.value);
      let txt_val = Number(frame_txt.value);

      if(slider_val == curr_frame && txt_val == curr_frame) { return; }

      if(slider_val != curr_frame) {
        curr_frame = slider_val;
        frame_txt.value = slider_val;
      }

      else if(txt_val != curr_frame) {
        curr_frame = txt_val;
        frame_slider.value = txt_val;
      }

      frame_txt.style.left = `${1.25 + 100*(curr_frame/num_frames) - offset}%`;

      update_colors();

    };

    this.new_gradient = function (hex_color_array) {
      color_gradient_rgb = [hex_to_normalized_rgb(hex_color_array[0]),
                            hex_to_normalized_rgb(hex_color_array[1]),
                            hex_to_normalized_rgb(hex_color_array[2])];
      update_colors();
    };

    this.new_data = function (coloring_data, frame_count) {

      temp_data = coloring_data;
      num_frames = frame_count;
      curr_frame = 0;

      frame_slider.min = 0;
      frame_slider.value = 0;
      frame_slider.max = frame_count - 1;

      init_norm_constant();

      color_min = real_min;
      color_max = real_max;

      update_colors();
      export_extrema();
    };

    this.new_extrema = function (min, max) {
      color_min = min;
      color_max = max;
      update_colors();
    };

    function init_norm_constant () {

      real_min = Infinity;
      real_max = -Infinity;

      for(let i = 0; i < temp_data.length; ++i) {
  			if(temp_data[i] > real_max) { real_max = temp_data[i]; }
  			if(temp_data[i] < real_min) { real_min = temp_data[i]; }
  		}

      if(real_max > real_min) {norm_constant = real_max - real_min;}

    };

    function normalize(temp) {
      return (temp-real_min)/norm_constant;
    };

    function export_extrema () {
      control_handler.adjust_extrema(real_min, real_max);
    };

    function update_colors () {

      if(curr_frame >= num_frames) { return control_handler.pause(); }

      for(let pt = 0; pt + 2 < pt_colors.length; pt += 3) {
        let temp_at_frame = temp_data[(pt/3)*num_frames + curr_frame];

        if(temp_at_frame !== temp_at_frame) { pt_alphas[pt/3] = 0; continue; }

        if(temp_at_frame < color_min) {temp_at_frame = color_min;}
        if(temp_at_frame > color_max) {temp_at_frame = color_max;}

        let color_3 = normalize(temp_at_frame);
        let color_1 = 1 - color_3;
        let color_2 = 2*Math.min(color_3, color_1);

        pt_colors[pt] = (color_gradient_rgb[0][0]*color_1 +
                         color_gradient_rgb[1][0]*color_2 +
                         color_gradient_rgb[2][0]*color_3);

        pt_colors[pt+1] = (color_gradient_rgb[0][1]*color_1 +
                           color_gradient_rgb[1][1]*color_2 +
                           color_gradient_rgb[2][1]*color_3);

        pt_colors[pt+2] = (color_gradient_rgb[0][2]*color_1 +
                           color_gradient_rgb[1][2]*color_2 +
                           color_gradient_rgb[2][2]*color_3);

        pt_alphas[pt/3] = 1;

      }

      color_attribute.needsUpdate = true;
      alpha_attribute.needsUpdate = true;


    };


    function hex_to_rgb(hex) {
			let color_str = hex.toLowerCase().split('#').pop();
			let red = 0;
			let green = 0;
			let blue = 0;
			if(color_str.length == 3) {
				red = 17*parseInt(color_str[0], 16);
				green =  17*parseInt(color_str[1], 16);
				blue = 17*parseInt(color_str[2], 16);
			}
			else if(color_str.length == 6) {
				red = 16*parseInt(color_str[0], 16) + parseInt(color_str[1], 16);
				green = 16*parseInt(color_str[2], 16) + parseInt(color_str[3], 16);
				blue = 16*parseInt(color_str[4], 16) + parseInt(color_str[5], 16);
			}
			return [red, green, blue];
		};


		function hex_to_normalized_rgb(hex) {
			let color_arr = hex_to_rgb(hex);
			for(let i = 0; i < color_arr.length; ++i) {
				color_arr[i] /= 255;
			}
			return color_arr;
		};

  }
}


export class PointController {
  constructor(point_size, pt_size_txt, pt_size_slider, control_handler) {

    control_handler.add(this);

    pt_size_txt.value = 1;
    pt_size_slider.value = 10;

    pt_size_slider.min = 0;
    pt_size_slider.max = 100;

    let max_num_width = 10*pt_size_slider.max.length;
    let offset = 100*max_num_width/window.innerWidth;
    pt_size_txt.style.width = `${max_num_width}px`;
    pt_size_txt.style.left = `${1.25 - offset}%`;

    this.check_update = function () {

      if(pt_size_txt.oninput) { return; }

      let new_size_txt = Number(pt_size_txt.value);
      let new_size_slider = Number(pt_size_slider.value);

      if(point_size.value !== new_size_txt) {
        pt_size_slider.value = Math.floor(new_size_txt*10);
        update_pt_size(new_size_txt);
      }

      else if(point_size.value !== new_size_slider) {
        pt_size_txt.value = new_size_slider/10;
        update_pt_size(new_size_slider/10);
      }

      pt_size_txt.style.left = `${1.25 + 100*point_size.value/10 - offset}%`;

    }
    function update_pt_size (pt_size) {
      point_size.value = pt_size;
    }
  }
}


export class LoopController {
  constructor(fps_input, frame_slider, frame_txt,
              forward_button, reverse_button, pause_button, control_handler) {

    control_handler.add(this);

    let curr_fps = 50;
    fps_input.value = 50;
    fps_input.style.width = `${10*5}px`;

    let loop = null;
    let pause = false;

    this.check_update = function () {
      if(!fps_input.oninput) { curr_fps = Number(fps_input.value); }
    };

    this.new_data = function (coloring_data, frame_count) {
      pause_loop();
    };

    this.pause = function () {
      pause_loop();
    };


    forward_button.onclick = function () {
      control_handler.pause();
      start_loop(1);
    };

    reverse_button.onclick = function () {
      control_handler.pause();
      start_loop(-1);
    };

    pause_button.onclick = function () {
      control_handler.pause();
    };


    function start_loop (direction) {

      if(curr_fps == null || curr_fps <= 0) {
        alert('Input Real Number for FPS');
        return;
      }

      let play = function () {
        frame_slider.value = Number(frame_slider.value) + direction;
      }

      loop = setInterval(play, 1000/curr_fps);

    };

    function pause_loop() {
      clearInterval(loop);
    };

  }
};


export class PlaneController {
  contructor(theta_input, phi_input, x_input, y_input, z_input, threshold,
             vertex_opacity, vertices, control_handler) {

    control_handler.add(this);

    let theta = null;
    let phi = null;
    let trans_x = null;
    let trans_y = null;
    let trans_z = null;
    let thres = null;

    this.check_update = function () {
      let new_theta = Number(theta_input);
      let new_phi = Number(phi_input);
      let new_x = Number(x_input);
      let new_y = Number(y_input);
      let new_z = Number(z_input);
      let new_thres = Number(threshold)

      if(new_theta == theta && new_phi == phi && trans_x == new_x &&
      trans_y == new_y && trans_z == new_z && thres == new_thres) { return; }

      theta = new_theta;
      phi = new_phi
      trans_x = new_x;
      trans_y = new_y;
      trans_z = new_z;
      thres = new_thres;

      update_plane();

    };

    function update_plane() {

      let v_i = Math.sin(phi)*Math.cos(theta);
      let v_j = Math.sin(phi)*Math.sin(theta);
      let v_k = Math.cos(phi);



    };


  }
}

export class RotationController {
  constructor(rotation_attribute, start, stop, control_handler) {

    control_handler.add(this);

    let pause = true;

    this.check_update = function () {
      if(!pause) {
        rotation_attribute.x += .005;
        rotation_attribute.y += .005;
      }
    }

    start.onclick = function() {
      pause = false;
    }

    stop.onclick = function() {
      pause = true;
    }
  }
}


export class DataCategoryController {
  constructor(vertex_data, data_category_input, video_display,
              picture_display, control_handler) {

    control_handler.add(this);

    let curr_data_category = null;
    let display_data = vertex_data;
    let frame_count = null;

    this.check_update = function () {
      if(curr_data_category !== data_category_input.value) {
        curr_data_category = data_category_input.value;
        update_data_category();
      }
    };

    function update_data_category () {
      if(curr_data_category != 'Temp') {
        for(let i = 0; i < video_display.length; ++i) {
          video_display[i].style.display = 'none';
        }
        for(let i = 0; i < picture_display.length; ++i) {
          picture_display[i].style.display = 'block';
        }
        frame_count = 1;
      }
      else {
        for(let i = 0; i < video_display.length; ++i) {
          video_display[i].style.display = 'block';
        }
        for(let i = 0; i < picture_display.length; ++i) {
          picture_display[i].style.display = 'none';
        }
        frame_count = vertex_data.frames_per_pt;
      }

      if(curr_data_category == 'Max') { display_data = vertex_data.maxima; }
      else if(curr_data_category == 'Min') { display_data = vertex_data.minima; }
      else if(curr_data_category == 'Mean') { display_data = vertex_data.means; }
      else if(curr_data_category == 'Var') { display_data = vertex_data.std_dev; }
      else if(curr_data_category == 'Range') { display_data = vertex_data.range; }
      else if(curr_data_category == 'Temp') { display_data = vertex_data.frames; }
      else { display_data = null; }

      export_display_data();

    };

    function export_display_data () {
      control_handler.adjust_data(display_data, frame_count);
    };

  }
};

export class TimeStampController {
  constructor(container, stamp_input,
              time_output, frame_slider,
              forward_button, pause_button, reverse_button,
              control_handler) {

    control_handler.add(this);

    let reader = new FileReader();
    let processed = new Set();
    let stamp_exts = ['csv'];
    let curr_time = null;
    let curr_frame = null;
    let stamps = [];
    let loop = [];


    this.check_update = function () {
      // read file input
      for(let i = 0; i < stamp_input.files.length; ++i) {
        if(!stamp_input.files[i] || processed.has(stamp_input.files[i])) {continue;}
        let exts = get_exts(stamp_input.files[i].name);
        for(let ext = 0; ext < exts.length; ++ext) {
          if(stamp_exts.includes(exts[ext])) {
            reader.readAsText(stamp_input.files[i]);
            processed.add(stamp_input.files[i]);
          }
        }
      }

      // check frame change
      let frame_num = Number(frame_slider.value);
      if(stamps.length > frame_num && curr_frame !== frame_num) {
        curr_frame = frame_num;
        curr_time = stamps[frame_num];
        time_output.value = curr_time;
      }

    }

    this.pause = function () {
      pause_loop();
    };

    reader.onload = function (e) {
      let file_text = e.target.result;
      stamps = file_text.split(/[,\n]+/);
      if(stamps[stamps.length - 1] == "") { stamps.pop(); }

      container.style.display = 'block';

      time_output.value = 0;
      time_output.style.width = `${10*5}px`;

    };

    forward_button.onclick = function () {
      control_handler.pause();
      start_loop(1);
    }

    reverse_button.onclick = function () {
      control_handler.pause();
      start_loop(-1);
    }

    pause_button.onclick = function () {
      control_handler.pause();
    }

    function start_loop (direction) {
      let play = function () {
        frame_slider.value = Number(frame_slider.value) + direction;
      }
      loop = [];
      let ms_elapsed = 0;
      for(let i = curr_frame; i+1 < stamps.length; ++i) {
        ms_elapsed += (stamps[i+1] - stamps[i]);
        loop.push(setTimeout(play, 1000*ms_elapsed));
      }
    };

    function pause_loop () {
      for(let i = 0; i < loop.length; ++i) { clearTimeout(loop[i]); }
      loop = [];
    }

    function get_exts(filename) {
			let exts = filename.split('.');
			exts.shift();
			return exts;
		};

  };
};

export class SliderController {
  constructor(slider_div, left_slider, right_slider,
              left_bubble, right_bubble, control_handler) {

    control_handler.add(this);

    let curr_min_val = Number(left_slider.min);
    let curr_max_val = Number(right_slider.max);
    let handler_called = false;

    this.check_update = function () {

      if(left_bubble.oninput || right_bubble.oninput) { return; }
      if(left_slider.oninput || right_slider.oninput) { return; }

      let left_txt_val = Number(left_bubble.value);
      let left_rng_val = Number(left_slider.value);

      let rght_txt_val = Number(right_bubble.value);
      let rght_rng_val = Number(right_slider.value);

      if(left_txt_val == curr_min_val && left_rng_val == curr_min_val &&
         rght_txt_val == curr_max_val && rght_rng_val == curr_max_val) { return; }

      if(left_txt_val != curr_min_val) {
       curr_min_val = left_txt_val;
       left_slider.value = left_txt_val;
      }

      else if(left_rng_val != curr_min_val) {
       curr_min_val = left_rng_val;
       left_bubble.value = left_rng_val;
      }

      if(rght_txt_val != curr_max_val) {
       curr_max_val = rght_txt_val;
       right_slider.value = rght_txt_val;
      }

      else if(rght_rng_val != curr_max_val) {
       curr_max_val = rght_rng_val;
       right_bubble.value = rght_rng_val;
      }

      update_sliders();
      export_extrema();

    }

    this.new_extrema = function (min, max) {

      if(handler_called) { handler_called = false; return; }

      left_slider.min = Math.floor(min);
      right_slider.max = Math.ceil(max);

      curr_min_val = Math.floor(min);
      curr_max_val = Math.ceil(max);

      left_slider.value = left_slider.min;
      right_slider.value = right_slider.max;

      left_bubble.value = left_slider.min;
      right_bubble.value = right_slider.max;

      let md_pt = Math.floor((curr_min_val + curr_max_val)/2);

      if(max - min > 3) {
				left_slider.max = md_pt;
				right_slider.min = md_pt + 1;
			}
			else {
				left_slider.max = md_pt;
				right_slider.min = md_pt;
			}

      right_slider.style.width = '50%';
			left_slider.style.width = '50%';

      let max_num_width = 10*(right_slider.max.length);
			if(100*(max_num_width/window.innerWidth) < 5) {
				right_bubble.style.width = `${max_num_width}px`;
				left_bubble.style.width = `${max_num_width}px`;
			}
      else {
        right_bubble.style.width = `${window.innerWidth*.05}`;
				left_bubble.style.width = `${window.innerWidth*.05}`;
      }

      update_sliders();

    };

    this.new_extrema(curr_min_val, curr_max_val);

    this.new_gradient = function (hex_color_array) {
      slider_div.style.background = `linear-gradient(to right, ${hex_color_array[0]},
    			 													 ${hex_color_array[1]}, ${hex_color_array[2]})`;
    };


    function export_extrema () {
      handler_called = true;
      control_handler.adjust_extrema(curr_min_val, curr_max_val);
    };


    function update_sliders () {

      let lower_bound = Math.floor(left_slider.value);
    	let lower_min = Math.floor(left_slider.min);
    	let lower_max = Math.floor(left_slider.max);
    	let lower_width = parseFloat(left_slider.style.width);

      let upper_bound = Math.floor(right_slider.value);
    	let upper_min = Math.floor(right_slider.min);
    	let upper_max = Math.floor(right_slider.max);
    	let upper_width = parseFloat(right_slider.style.width);

      // kind of arbitrary -- we should consider fixing
      if(upper_max - lower_min < 3) { return; }

      // 100% width = (upper_max - lower_min)
    	// 1% width = (upper_max - lower_min)/100
    	let kelvin_per_pct_width = (upper_max - lower_min)/100;

    	let right_shift_factor = 1;
    	let left_shift_factor = 1;

    	if(upper_min + kelvin_per_pct_width < upper_max) { right_shift_factor = kelvin_per_pct_width; }
    	if(lower_max - kelvin_per_pct_width > lower_min) { left_shift_factor = kelvin_per_pct_width; }

      if(lower_width < 1/kelvin_per_pct_width) {lower_width = 1/kelvin_per_pct_width;}
      if(upper_width < 1/kelvin_per_pct_width) {upper_width = 1/kelvin_per_pct_width;}

      right_shift_factor = Math.floor(right_shift_factor);
      left_shift_factor = Math.floor(left_shift_factor);

    	if(lower_bound >= lower_max && upper_min + right_shift_factor < upper_max) {
    		upper_min += right_shift_factor;
    		lower_max += right_shift_factor;
    		lower_width += right_shift_factor/kelvin_per_pct_width;
    		if(upper_bound <= upper_min) { upper_bound += right_shift_factor; }
    	}

    	else if(upper_bound <= upper_min && lower_max - left_shift_factor > lower_min) {
    		upper_min -= left_shift_factor;
    		lower_max -= left_shift_factor;
    		lower_width -= left_shift_factor/kelvin_per_pct_width;
    		if(lower_bound >= lower_max) { lower_bound -= left_shift_factor; }
    	}

      left_slider.value = lower_bound;
      right_slider.value = upper_bound;

      left_bubble.value = lower_bound;
      right_bubble.value = upper_bound;

      curr_min_val = lower_bound;
      curr_max_val = upper_bound;

      left_slider.max = lower_max;
      right_slider.min = upper_min;

      left_slider.style.width = `${lower_width}%`;
		  right_slider.style.width = `${100 - lower_width}%`;

      let offset = parseFloat(left_bubble.style.width)/(window.innerWidth)*100;
  		left_bubble.style.left = `${(lower_bound-lower_min)/kelvin_per_pct_width - offset}%`;
  		right_bubble.style.left = `${(upper_bound-lower_min)/kelvin_per_pct_width - offset}%`;


    };

  }

};
