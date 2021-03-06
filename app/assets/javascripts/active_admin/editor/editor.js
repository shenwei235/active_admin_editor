//= require_tree ./templates

;(function(window, wysihtml5) {
  window.AA = (window.AA || {})
  var config

  var Editor = function(options, el) {
    config          = options
    var _this       = this
    this.$el        = $(el)
    this.$textarea  = this.$el.find('textarea')
    this.policy     = this.$el.data('policy')

    this._addToolbar()
    this._attachEditor()
  }

  /**
   * Returns the wysihtml5 editor instance for this editor.
   */
  Editor.prototype.editor = function() {
    return this._editor
  }

  /**
   * Adds the wysihtml5 toolbar. If uploads are enabled, also adds the
   * necessary file inputs for uploading.
   */
  Editor.prototype._addToolbar = function() {
    var template = JST['active_admin/editor/templates/toolbar']({
      id: this.$el.attr('id') + '-toolbar'
    })

    this.$toolbar = $(template)

    if (config.uploads_enabled) {
      var _this = this
      this.$toolbar.find('input.uploadable').each(function() {
        _this._addUploader(this)
      })
    }

    this.$el.find('.wrap').prepend(this.$toolbar)
  }

  /**
   * Adds a file input attached to the supplied text input. And upload is
   * triggered if the source of the input is changed.
   *
   * @input Text input to attach a file input to. 
   */
  Editor.prototype._addUploader = function(input) {
    var $input = $(input)

    var template = JST['active_admin/editor/templates/uploader']({ spinner: config.spinner })
    var $uploader = $(template)

    var $dialog = $input.closest('[data-wysihtml5-dialog]')
    $dialog.append($uploader)

    var _this = this
    $uploader.find('input:file').on('change', function() {
      var file = this.files[0]
      if (file) {
        $input.val('')
        _this.upload(file, function(location) {
          $input.val(location)
        })
      }
    })
  }

  /**
   * Initializes the wysihtml5 editor for the textarea.
   */
  Editor.prototype._attachEditor = function() {
    this._editor = new wysihtml5.Editor(this.$textarea.attr('id'), {
      toolbar: this.$toolbar.attr('id'),
      stylesheets: config.stylesheets,
      parserRules: config.parserRules
    })
  }

  /**
   * Sets the internal uploading state to true or false. Adds the .uploading
   * class to the root element for stying.
   *
   * @uploading {Boolean} Whether or not something is being uploaded.
   */
  Editor.prototype._uploading = function(uploading) {
    this.__uploading = uploading
    this.$el.toggleClass('uploading', this.__uploading)
    return this.__uploading
  }

  /**
   * Uploads a file to S3. When the upload is complete, calls callback with the
   * location of the uploaded file.
   *
   * @file The file to upload
   * @callback A function to be called when the upload completes.
   */
  Editor.prototype.upload = function(file, callback) {
    var _this = this
    
    var reader  = new FileReader();
    
    reader.addEventListener("load", function () {
      var fileBase64 = reader.result;
      var formData = { image: { base64: fileBase64, imageable_type: 'Article', imageable_id: $('#article_id').val() } };
      
      $.ajax({
        url: '/my/images',
        data: formData,
        //Ajax events
        beforeSend: function (e) {
          _this._uploading(true)
        },
        success: function (e) {
          callback(e.url)
         _this._uploading(false)
          
        },
        error: function (e) {
          alert('error');
          _this._uploading(false)
          
        },
        // Form data
        method: 'POST'
      });
    }, false);
    
    reader.readAsDataURL(file);

    // return xhr
  }

  window.AA.Editor = Editor
  
  wysihtml5.commands.insertHr = {
    // exec usually behaves like a toggle
    // if the format is applied then undo it (and vica versa)
    exec: function(composer, command, param) {
      composer.commands.exec("insertHTML", "<hr/>");
    },

    // usually returns a truthy value when the command is applied to the current selection
    // a falsy when the current selection isn't formatted with <foo>
    state: function(composer, command) {
       return false;
    },

    // ignore this for now (it's currently not used)
    value: function() {
    }
  };
  
})(window, wysihtml5)

;(function(window, $) {
  if ($.widget) {
    $.widget.bridge('editor', window.AA.Editor)
  }
})(window, jQuery)


