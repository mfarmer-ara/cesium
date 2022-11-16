/**
 * Transpiles a [GLSL 3.00]{@link https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf}
 * shader to a [GLSL 1.00]{@link https://registry.khronos.org/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf} shader.
 *
 * This function does not aim to provide a comprehensive transpilation from GLSL 3.00 to GLSL 1.00; only the functionality
 * used within the CesiumJS shaders is supported.
 *
 * @param {string} input The GLSL 3.00 shader.
 * @param {boolean} isFragmentShader True if the shader is a fragment shader.
 *
 * @return {string}
 */
function demodernizeShader(input, isFragmentShader) {
  let output = input;

  // Replace the version string from "#version 300 es" to "#version 100".
  output = output.replaceAll(`version 300 es`, `version 100`);

  // Replace all czm_textureCube calls with textureCube
  output = output.replaceAll(/czm_textureCube/g, `textureCube`);

  // Replace all texture calls with texture2D
  output = output.replaceAll(
    /(texture\()/g,
    `texture2D(` // Trailing ')' is included in the match group.
  );

  if (isFragmentShader) {
    // Replace the in with varying.
    output = output.replaceAll(/(in)\s+(vec\d|mat\d|float)/g, `varying $2`);

    if (/out_FragData_(\d+)/.test(output)) {
      output = `#extension GL_EXT_draw_buffers : enable\n ${output}`;

      // Remove all layout declarations for out_FragData.
      output = output.replaceAll(
        /layout \(location = \d+\) vec4 out_FragData_\d+;/g,
        ``
      );

      // Replace out_FragData with gl_FragData.
      output = output.replaceAll(/out_FragData_(\d+)/g, `gl_FragData[$1]`);
    }

    // Replace out_FragColor with gl_FragColor.
    output = output.replaceAll(/out_FragColor/g, `gl_FragColor`);
    output = output.replaceAll(/out_FragColor\[(\d+)\]/g, `gl_FragColor[$1]`);

    // Remove all layout declarations for out_FragColor.
    output = output.replaceAll(
      /layout \(location = 0\) vec4 out_FragColor/g,
      ``
    );

    if (/gl_FragDepth/.test(output)) {
      output = `#extension GL_EXT_frag_depth : enable\n ${output}`;
      // Replace gl_FragDepth with gl_FragDepthEXT.
      output = output.replaceAll(/gl_FragDepth/g, `gl_FragDepthEXT`);
    }
  } else {
    // Replace the in with attribute.
    output = output.replaceAll(/(in)\s+(vec\d|mat\d|float)/g, `attribute $2`);

    // Replace the out with varying.
    output = output.replaceAll(
      /(out)\s+(vec\d|mat\d|float)\s+([A-z_0-9]+);/g,
      `varying $2 $3;`
    );
  }

  return output;
}

export default demodernizeShader;
