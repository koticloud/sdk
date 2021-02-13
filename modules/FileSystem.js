import HasEvents from "../traits/HasEvents";

class FileSystem
{
    openFileDialog(options = {}) {
        const input = document.createElement('input');
        input.type = "file";

        // Options
        input.multiple = options.multiple ? options.multiple : false;
        input.accept = options.mimes ? options.mimes : '*';

        // Events
        input.addEventListener('change', (e) => {
            this._onFilesSelected(e, options)
        });

        // Trigger/open the file dialog
        input.click();
    }

    _onFilesSelected(e, options) {
        const inputFiles = e.target.files;

        if (!inputFiles.length) {
            return;
        }

        for (let file of inputFiles) {
            this.emit('file-selected', file);

            const reader = new FileReader();

            reader.addEventListener('error', () => {
                this.emit('file-loading-failed', file);
            });

            reader.addEventListener('abort', () => {
                this.emit('file-loading-failed', file);
            });

            reader.addEventListener('load', (e) => {
                this.emit('file-loaded', {
                    file,
                    content: e.target.result,
                });
            });
            
            reader.readAsBinaryString(file);

            if (!options.multiple) {
                break;
            }
        }
    }

    //     var file = files[0];
    //     var reader = new FileReader();
    //     reader.onload = onFileLoaded;
    //     reader.readAsDataURL(file);
    // }

    // onFileLoaded (e) {
    //     var match = /^data:(.*);base64,(.*)$/.exec(e.target.result);
    //     if (match == null) {
    //         throw 'Could not parse result'; // should not happen
    //     }
    //     var mimeType = match[1];
    //     var content = match[2];
    //     alert(mimeType);
    //     alert(content);
    // }
}

/**
 * Traits
 */
Object.assign(FileSystem.prototype, HasEvents);

export default FileSystem;