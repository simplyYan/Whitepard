var layout
var sourceEditor
var stdinEditor
var stdoutEditor
var currentLanguageId
var $selectLanguage
var $compilerOptions
var $commandLineArguments
var $insertTemplateBtn
var $runBtn
var $navigationMessage
var $updates
var $statusLine
var timeStart
var timeEnd
var defaultUrl = localStorageGetItem('api-url') || 'https://ce.judge0.com'
var apiUrl = defaultUrl
var wait = localStorageGetItem('wait') || true
var check_timeout = 300
var blinkStatusLine = 'true' === (localStorageGetItem('blink') || 'true')
var editorMode = localStorageGetItem('editorMode') || 'normal'
var editorModeObject = null
var fontSize = 14
var isEditorDirty = false
var layoutConfig = {
  settings: {
    showPopoutIcon: false,
    reorderEnabled: true,
  },
  dimensions: {
    borderWidth: 3,
    headerHeight: 22,
  },
  content: [
    {
      type: 'column',
      content: [
        {
          type: 'component',
          height: 70,
          componentName: 'source',
          id: 'source',
          title: 'SOURCE',
          isClosable: false,
          componentState: { readOnly: false },
        },
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'stdin',
              id: 'stdin',
              title: 'Input',
              isClosable: false,
              componentState: { readOnly: false },
            },
            {
              type: 'component',
              componentName: 'stdout',
              id: 'stdout',
              title: 'Output',
              isClosable: false,
              componentState: { readOnly: true },
            },
          ],
        },
      ],
    },
  ],
}
function encode(_0xc12244) {
  return btoa(unescape(encodeURIComponent(_0xc12244 || '')))
}
function decode(_0x6d2724) {
  var _0x48c841 = escape(atob(_0x6d2724 || ''))
  try {
    return decodeURIComponent(_0x48c841)
  } catch {
    return unescape(_0x48c841)
  }
}
function localStorageSetItem(_0x21c7e7, _0x56abd5) {
  try {
    localStorage.setItem(_0x21c7e7, _0x56abd5)
  } catch (_0x19255e) {}
}
function localStorageGetItem(_0x423646) {
  try {
    return localStorage.getItem(_0x423646)
  } catch (_0x2d6ede) {
    return null
  }
}
function showMessages() {
  var _0x3c5d00 =
    $updates.offset().left -
    parseFloat($updates.css('padding-left')) -
    $navigationMessage.parent().offset().left -
    parseFloat($navigationMessage.parent().css('padding-left')) -
    5
  if (!(_0x3c5d00 < 200) && undefined !== _0x405142) {
    var _0x5ed946 = _0x405142.messages
    $navigationMessage.css('animation-duration', _0x405142.duration)
    $navigationMessage.parent().width(_0x3c5d00 - 5)
    var _0x13a0f7 = ''
    for (var _0x297925 = 0; _0x297925 < _0x5ed946.length; _0x297925 += 1) {
      _0x13a0f7 += '' + _0x5ed946[_0x297925]
      if (_0x297925 != _0x5ed946.length - 1) {
        _0x13a0f7 += '&nbsp'.repeat(Math.min(200, _0x5ed946[_0x297925].length))
      }
    }
    $navigationMessage.html(_0x13a0f7)
  }
}
function loadMessages() {
  $.ajax({
    url: 'https://minio.judge0.com/public/ide/messages.json?' + Date.now(),
    type: 'GET',
    headers: { Accept: 'application/json' },
    success: function (_0x405142, _0x2a433e, _0x132396) {
      showMessages()
    },
  })
}
function showError(_0x1f4b8f, _0xdd92d9) {
  $('#site-modal #title').html(_0x1f4b8f)
  $('#site-modal .content').html(_0xdd92d9)
  $('#site-modal').modal('show')
}
function handleError(_0x5804c6, _0x28ef00, _0x442368) {
  showError(
    _0x5804c6.statusText + ' (' + _0x5804c6.status + ')',
    '<pre>' + JSON.stringify(_0x5804c6, null, 4) + '</pre>'
  )
}
function handleRunError(_0x1548ac, _0xc9c8f6, _0x3c0945) {
  handleError(_0x1548ac, _0xc9c8f6, _0x3c0945)
  $runBtn.removeClass('loading')
}
function handleResult(_0x3fa083) {
  timeEnd = performance.now()
  console.log(
    'It took ' + (timeEnd - timeStart) + ' ms to get submission result.'
  )
  var _0x282b1c = _0x3fa083.status
  var _0x22a7ee = decode(_0x3fa083.stdout)
  var _0x442f5c = decode(_0x3fa083.compile_output)
  var _0x4df8a3 = null === _0x3fa083.time ? '-' : _0x3fa083.time + 's'
  var _0x1a864e = null === _0x3fa083.memory ? '-' : _0x3fa083.memory + 'KB'
  $statusLine.html(_0x282b1c.description + ', ' + _0x4df8a3 + ', ' + _0x1a864e)
  if (blinkStatusLine) {
    $statusLine.addClass('blink')
    setTimeout(function () {
      blinkStatusLine = false
      localStorageSetItem('blink', 'false')
      $statusLine.removeClass('blink')
    }, 3000)
  }
  var _0x3373c4 = [_0x442f5c, _0x22a7ee].join('\n').trim()
  stdoutEditor.setValue(_0x3373c4)
  if ('' !== _0x3373c4) {
    var _0xb43fb3 = document.getElementById('stdout-dot')
    if (!_0xb43fb3.parentElement.classList.contains('lm_active')) {
      _0xb43fb3.hidden = false
    }
  }
  $runBtn.removeClass('loading')
}
function getIdFromURI() {
  return location.search.substr(1).trim().split('&')[0]
}
function downloadSource() {
  var _0x3d158a = parseInt($selectLanguage.val())
  download(sourceEditor.getValue(), fileNames[_0x3d158a], 'text/plain')
}
function loadSavedSource() {
  if (36 == (snippet_id = getIdFromURI()).length) {
    $.ajax({
      url:
        apiUrl +
        '/submissions/' +
        snippet_id +
        '?fields=source_code,language_id,stdin,stdout,stderr,compile_output,message,time,memory,status,compiler_options,command_line_arguments&base64_encoded=true',
      type: 'GET',
      success: function (_0x4f2b94, _0x43b87d, _0x3d50a2) {
        sourceEditor.setValue(decode(_0x4f2b94.source_code))
        $selectLanguage.dropdown('set selected', _0x4f2b94.language_id)
        $compilerOptions.val(_0x4f2b94.compiler_options)
        $commandLineArguments.val(_0x4f2b94.command_line_arguments)
        stdinEditor.setValue(decode(_0x4f2b94.stdin))
        stdoutEditor.setValue(decode(_0x4f2b94.stdout))
        var _0x2f8cb6 = null === _0x4f2b94.time ? '-' : _0x4f2b94.time + 's'
        var _0x100ef6 =
          null === _0x4f2b94.memory ? '-' : _0x4f2b94.memory + 'KB'
        $statusLine.html(
          _0x4f2b94.status.description + ', ' + _0x2f8cb6 + ', ' + _0x100ef6
        )
        changeEditorLanguage()
      },
      error: handleRunError,
    })
  } else {
    loadRandomLanguage()
  }
}
function run() {
  if ('' === sourceEditor.getValue().trim()) {
    showError('Error', "Source code can't be empty!")
    return
  }
  $runBtn.addClass('loading')
  document.getElementById('stdout-dot').hidden = true
  stdoutEditor.setValue('')
  var _0x102024 = layout.root.getItemsById('stdout')[0]
  _0x102024.parent.header.parent.setActiveContentItem(_0x102024)
  var _0x114628 = encode(sourceEditor.getValue())
  var _0x288b36 = encode(stdinEditor.getValue())
  var _0x23e7fd = resolveLanguageId($selectLanguage.val())
  var _0x59e446 = $compilerOptions.val()
  var _0x5d2029 = $commandLineArguments.val()
  if (44 === parseInt(_0x23e7fd)) {
    _0x114628 = sourceEditor.getValue()
  }
  var _0x1ecd36 = {
    source_code: _0x114628,
    language_id: _0x23e7fd,
    stdin: _0x288b36,
    compiler_options: _0x59e446,
    command_line_arguments: _0x5d2029,
    redirect_stderr_to_stdout: true,
  }
  var _0x2c6a67 = function (_0x71ac66) {
    timeStart = performance.now()
    $.ajax({
      url: apiUrl + ('/submissions?base64_encoded=true&wait=' + wait),
      type: 'POST',
      async: true,
      contentType: 'application/json',
      data: JSON.stringify(_0x71ac66),
      xhrFields: { withCredentials: -1 != apiUrl.indexOf('/secure') },
      success: function (_0x449d94, _0xba2fde, _0x25286a) {
        console.log('Your submission token is: ' + _0x449d94.token)
        if (true == wait) {
          handleResult(_0x449d94)
        } else {
          setTimeout(fetchSubmission.bind(null, _0x449d94.token), 300)
        }
      },
      error: handleRunError,
    })
  }
  var _0x40f408 = false
  if (82 === parseInt(_0x23e7fd)) {
    if ('' === sqliteAdditionalFiles) {
      _0x40f408 = true
      $.ajax({
        url:
          'https://minio.judge0.com/public/ide/sqliteAdditionalFiles.base64.txt?' +
          Date.now(),
        type: 'GET',
        async: true,
        contentType: 'text/plain',
        success: function (_0x4f00b9, _0x24caaf, _0x5ab408) {
          sqliteAdditionalFiles = _0x4f00b9
          _0x1ecd36.additional_files = sqliteAdditionalFiles
          _0x2c6a67(_0x1ecd36)
        },
        error: handleRunError,
      })
    } else {
      _0x1ecd36.additional_files = sqliteAdditionalFiles
    }
  }
  if (!_0x40f408) {
    _0x2c6a67(_0x1ecd36)
  }
}
function fetchSubmission(_0x549bd0) {
  $.ajax({
    url: apiUrl + '/submissions/' + _0x549bd0 + '?base64_encoded=true',
    type: 'GET',
    async: true,
    success: function (_0x5ef79b, _0x5214c2, _0x54236f) {
      if (_0x5ef79b.status.id <= 2) {
        setTimeout(fetchSubmission.bind(null, _0x549bd0), 300)
        return
      }
      handleResult(_0x5ef79b)
    },
    error: handleRunError,
  })
}
function changeEditorLanguage() {
  monaco.editor.setModelLanguage(
    sourceEditor.getModel(),
    $selectLanguage.find(':selected').attr('mode')
  )
  currentLanguageId = parseInt($selectLanguage.val())
  $('.lm_title')[0].innerText = fileNames[currentLanguageId]
  apiUrl = resolveApiUrl($selectLanguage.val())
}
function insertTemplate() {
  currentLanguageId = parseInt($selectLanguage.val())
  sourceEditor.setValue(sources[currentLanguageId])
  stdinEditor.setValue(inputs[currentLanguageId] || '')
  $compilerOptions.val(compilerOptions[currentLanguageId] || '')
  changeEditorLanguage()
}
function loadRandomLanguage() {
  var _0xbc496f = []
  for (
    var _0x4ac829 = 0;
    _0x4ac829 < $selectLanguage[0].options.length;
    _0x4ac829 += 1
  ) {
    _0xbc496f.push($selectLanguage[0].options[_0x4ac829].value)
  }
  $selectLanguage.dropdown('set selected', _0xbc496f[19])
  apiUrl = resolveApiUrl($selectLanguage.val())
  insertTemplate()
}
function resizeEditor(_0x28f9d5) {
  if ('normal' != editorMode) {
    var _0x465070 = $('#editor-status-line').height()
    _0x28f9d5.height -= _0x465070
    _0x28f9d5.contentHeight -= _0x465070
  }
}
function disposeEditorModeObject() {
  try {
    editorModeObject.dispose()
    editorModeObject = null
  } catch (_0x4a84c6) {}
}
function changeEditorMode() {
  disposeEditorModeObject()
  if ('vim' == editorMode) {
    editorModeObject = _0x22c55d.initVimMode(
      sourceEditor,
      $('#editor-status-line')[0]
    )
  } else {
    if ('emacs' == editorMode) {
      var _0x5a1db8 = $('#editor-status-line')[0]
      ;(editorModeObject = new _0x586cb6.EmacsExtension(
        sourceEditor
      )).onDidMarkChange(function (_0x27d288) {
        _0x5a1db8.textContent = _0x27d288 ? 'Mark Set!' : 'Mark Unset'
      })
      editorModeObject.onDidChangeKey(function (_0x5388d0) {
        _0x5a1db8.textContent = _0x5388d0
      })
      editorModeObject.start()
    }
  }
}
function resolveLanguageId(_0x4c62b2) {
  return languageIdTable[(_0x4c62b2 = parseInt(_0x4c62b2))] || _0x4c62b2
}
function resolveApiUrl(_0x147ba7) {
  return languageApiUrlTable[(_0x147ba7 = parseInt(_0x147ba7))] || defaultUrl
}
function editorsUpdateFontSize(_0x3b8f0f) {
  sourceEditor.updateOptions({ fontSize: _0x3b8f0f })
  stdinEditor.updateOptions({ fontSize: _0x3b8f0f })
  stdoutEditor.updateOptions({ fontSize: _0x3b8f0f })
}
function updateScreenElements() {
  var _0x5ed41c = window.innerWidth <= 1200 ? 'none' : ''
  $('.wide.screen.only').each(function (_0x39e8c9) {
    $(this).css('display', _0x5ed41c)
  })
}
$(window).resize(function () {
  layout.updateSize()
  updateScreenElements()
  showMessages()
})
$(document).ready(function () {
  updateScreenElements()
  console.log('ERROR 930')
  ;($selectLanguage = $('#select-language')).change(function (_0x7cefa) {
    if (isEditorDirty) {
      changeEditorLanguage()
    } else {
      insertTemplate()
    }
  })
  $compilerOptions = $('#compiler-options')
  $commandLineArguments = $('#command-line-arguments')
  $commandLineArguments.attr(
    'size',
    $commandLineArguments.attr('placeholder').length
  )
  $insertTemplateBtn = $('#insert-template-btn')
  $insertTemplateBtn.click(function (_0x4e4cd2) {
    if (
      isEditorDirty &&
      confirm('Are you sure? Your current changes will be lost.')
    ) {
      insertTemplate()
    }
  })
  $runBtn = $('#run-btn')
  $runBtn.click(function (_0xb23eee) {
    run()
  })
  $navigationMessage = $('#navigation-message span')
  $updates = $('#judge0-more')
  $('input[name="editor-mode"][value="' + editorMode + '"]').prop(
    'checked',
    true
  )
  $('input[name="editor-mode"]').on('change', function (_0x16ba2c) {
    localStorageSetItem('editorMode', (editorMode = _0x16ba2c.target.value))
    resizeEditor(sourceEditor.getLayoutInfo())
    changeEditorMode()
    sourceEditor.focus()
  })
  $statusLine = $('#status-line')
  $(document).on('keydown', 'body', function (_0x3b4441) {
    var _0x43bdd4 = _0x3b4441.keyCode || _0x3b4441.which
    if (120 == _0x43bdd4) {
      _0x3b4441.preventDefault()
      run()
    } else {
      if (119 == _0x43bdd4) {
        _0x3b4441.preventDefault()
        var _0x1813ae = prompt('Enter URL of Myth API:', apiUrl)
        if (null != _0x1813ae) {
          _0x1813ae = _0x1813ae.trim()
        }
        if (null != _0x1813ae && '' != _0x1813ae) {
          localStorageSetItem('api-url', (apiUrl = _0x1813ae))
        }
      } else {
        if (118 == _0x43bdd4) {
          _0x3b4441.preventDefault()
          localStorageSetItem('wait', (wait = !wait))
          alert('Submission wait is ' + (wait ? 'ON. Enjoy' : 'OFF') + '.')
        } else {
          if (event.ctrlKey && 107 == _0x43bdd4) {
            _0x3b4441.preventDefault()
            editorsUpdateFontSize((fontSize += 1))
          } else {
            if (event.ctrlKey && 109 == _0x43bdd4) {
              _0x3b4441.preventDefault()
              editorsUpdateFontSize((fontSize -= 1))
            }
          }
        }
      }
    }
  })
  $('select.dropdown').dropdown()
  $('.ui.dropdown').dropdown()
  $('.ui.dropdown.site-links').dropdown({
    action: 'hide',
    on: 'hover',
  })
  $('.ui.checkbox').checkbox()
  $('.message .close').on('click', function () {
    $(this).closest('.message').transition('fade')
  })
  loadMessages()
  require([
    'vs/editor/editor.main',
    'monaco-vim',
    'monaco-emacs',
  ], function (_0x17021f, _0x22c55d, _0x586cb6) {
    layout = new GoldenLayout(layoutConfig, $('#site-content'))
    layout.registerComponent('source', function (_0x21a432, _0x166a08) {
      sourceEditor = monaco.editor.create(_0x21a432.getElement()[0], {
        automaticLayout: true,
        theme: 'vs-dark',
        scrollBeyondLastLine: true,
        readOnly: _0x166a08.readOnly,
        language: 'cpp',
        minimap: { enabled: false },
      })
      changeEditorMode()
      sourceEditor.getModel().onDidChangeContent(function (_0x282bf5) {
        currentLanguageId = parseInt($selectLanguage.val())
        isEditorDirty = sourceEditor.getValue() != sources[currentLanguageId]
      })
      sourceEditor.onDidLayoutChange(resizeEditor)
    })
    layout.registerComponent('stdin', function (_0x5be67e, _0x15957d) {
      stdinEditor = monaco.editor.create(_0x5be67e.getElement()[0], {
        automaticLayout: true,
        theme: 'vs-dark',
        scrollBeyondLastLine: false,
        readOnly: _0x15957d.readOnly,
        language: 'plaintext',
        minimap: { enabled: false },
      })
    })
    layout.registerComponent('stdout', function (_0x710cd, _0x349c5b) {
      stdoutEditor = monaco.editor.create(_0x710cd.getElement()[0], {
        automaticLayout: true,
        theme: 'vs-dark',
        scrollBeyondLastLine: false,
        readOnly: _0x349c5b.readOnly,
        language: 'plaintext',
        minimap: { enabled: false },
      })
      _0x710cd.on('tab', function (_0x17d9e7) {
        _0x17d9e7.element.append(
          '<span id="stdout-dot" class="dot" hidden></span>'
        )
        _0x17d9e7.element.on('mousedown', function (_0x235792) {
          _0x235792.target.closest('.lm_tab').children[3].hidden = true
        })
      })
    })
    layout.on('initialised', function () {
      $('.monaco-editor')[0].appendChild($('#editor-status-line')[0])
      if (location.search.substr(1).trim().split('&')[0]) {
        loadSavedSource()
      } else {
        loadRandomLanguage()
      }
      $('#site-navigation').css('border-bottom', '1px solid black')
      sourceEditor.focus()
      editorsUpdateFontSize(fontSize)
    })
    layout.init()
  })
})
var assemblySource =
  "section    .text\n    global _start\n\n_start:\n\n    xor  eax, eax\n    lea   edx, [rax+len]\n    mov al, 1\n    mov  esi, msg\n    mov   edi, eax\n    syscall\n\n    xor    edi, edi\n    lea   eax, [rdi+60]\n    syscall\n\nsection   .rodata\n\nmsg  db 'hello, world', 0xa\nlen equ $ - msg\n"
var bashSource = 'echo "hello, world"'
var basicSource = 'PRINT "hello, world"'
var cSource =
  '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n'
var csharpSource =
  'public class Hello {\n    public static void Main() {\n        System.Console.WriteLine("hello, world");\n    }\n}\n'
var cppSource =
  '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n'
var competitiveProgrammingSource = 'Hello, World!'
var clojureSource = '(println "hello, world")\n'
var cobolSource =
  'IDENTIFICATION DIVISION.\nPROGRAM-ID. MAIN.\nPROCEDURE DIVISION.\nDISPLAY "hello, world".\nSTOP RUN.\n'
var lispSource = '(write-line "hello, world")'
var dSource =
  'import std.stdio;\n\nvoid main()\n{\n    writeln("hello, world");\n}\n'
var elixirSource = 'IO.puts "hello, world"'
var erlangSource = 'main(_) ->\n    io:fwrite("hello, world\\n").\n'
var executableSource =
  'Myth assumes that content of executable is Base64 encoded.\n\nThis means that you should Base64 encode content of your binary,\npaste it here and click "Run".\n\nHere is an example of compiled "hello, world" NASM program.\nContent of compiled binary is Base64 encoded and used as source code.\n\nhttps://ide.judge0.com/?kS_f\n'
var fsharpSource = 'printfn "hello, world"\n'
var fortranSource = 'program main\n    print *, "hello, world"\nend\n'
var goSource =
  'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("hello, world")\n}\n'
var groovySource = 'println "hello, world"\n'
var haskellSource = 'main = putStrLn "hello, world"'
var javaSource =
  'public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello, world");\n    }\n}\n'
var javaScriptSource = 'console.log("hello, world");'
var kotlinSource = 'fun main() {\n    println("mythcoder, is insane")\n}\n'
var luaSource = 'print("mythcoder, is insane")'
var objectiveCSource =
  '#import <Foundation/Foundation.h>\n\nint main() {\n    @autoreleasepool {\n        char name[10];\n        scanf("%s", name);\n        NSString *message = [NSString stringWithFormat:@"hello, %s\\n", name];\n        printf("%s", message.UTF8String);\n    }\n    return 0;\n}\n'
var ocamlSource = 'print_endline "mythcoder, is insane"'
var octaveSource = 'printf("hello, world\\n");'
var pascalSource = "program Hello;\nbegin\n    writeln ('hello, world')\nend.\n"
var perlSource = 'my $name = <STDIN>;\nprint "hello, $name";\n'
var phpSource = '<?php\nprint("hello, world\\n");\n?>\n'
var plainTextSource = 'mythcoder, is insane\n'
var prologSource =
  ":- initialization(main).\nmain :- write('mythcoder, is insane\\n').\n"
var pythonSource = 'print("hello, world")'
var rSource = 'cat("hello, world\\n")'
var rubySource = 'puts "hello, world"'
var rustSource = 'fn main() {\n    println!("hello, world");\n}\n'
var scalaSource =
  'object Main {\n    def main(args: Array[String]) = {\n        val name = scala.io.StdIn.readLine()\n        println("hello, "+ name)\n    }\n}\n'
var sqliteSource =
  '-- On Judge0 IDE your SQL script is run on chinook database (https://www.sqlitetutorial.net/sqlite-sample-database).\n-- For more information about how to use SQL with Judge0 API please\n-- watch this asciicast: https://asciinema.org/a/326975.\nSELECT\n    Name, COUNT(*) AS num_albums\nFROM artists JOIN albums\nON albums.ArtistID = artists.ArtistID\nGROUP BY Name\nORDER BY num_albums DESC\nLIMIT 4;\n'
var sqliteAdditionalFiles = ''
var swiftSource =
  'import Foundation\nlet name = readLine()\nprint("hello, \\(mythcoder!)")\n'
var typescriptSource = 'console.log("mythcoder, is insane");'
var vbSource =
  '<html>\n   <head>\n      <title></title>\n   </head>\n <body>\n  </body>\n  </html>\n'
var c3Source =
  '// On the Myth IDE, C3 is automatically\n// updated every hour to the latest commit on master branch.\nmodule main;\n\nextern func void printf(char *str, ...);\n\nfunc int main()\n{\n    printf("hello, world\\n");\n    return 0;\n}\n'
var javaTestSource =
  'import static org.junit.jupiter.api.Assertions.assertEquals;\n\nimport org.junit.jupiter.api.Test;\n\nclass MainTest {\n    static class Calculator {\n        public int add(int x, int y) {\n            return x + y;\n        }\n    }\n\n    private final Calculator calculator = new Calculator();\n\n    @Test\n    void addition() {\n        assertEquals(2, calculator.add(1, 1));\n    }\n}\n'
var mpiccSource =
  '// Try adding "-n 5" (without quotes) into command line arguments. \n#include <mpi.h>\n\n#include <stdio.h>\n\nint main()\n{\n    MPI_Init(NULL, NULL);\n\n    int world_size;\n    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\n    int world_rank;\n    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\n    printf("Hello from processor with rank %d out of %d processors.\\n", world_rank, world_size);\n\n    MPI_Finalize();\n\n    return 0;\n}\n'
var mpicxxSource =
  '// Try adding "-n 5" (without quotes) into command line arguments. \n#include <mpi.h>\n\n#include <iostream>\n\nint main()\n{\n    MPI_Init(NULL, NULL);\n\n    int world_size;\n    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\n    int world_rank;\n    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\n    std::cout << "Hello from processor with rank "\n              << world_rank << " out of " << world_size << " processors.\\n";\n\n    MPI_Finalize();\n\n    return 0;\n}\n'
var mpipySource =
  '# Try adding "-n 5" (without quotes) into command line arguments. \nfrom mpi4py import MPI\n\ncomm = MPI.COMM_WORLD\nworld_size = comm.Get_size()\nworld_rank = comm.Get_rank()\n\nprint(f"Hello from processor with rank {world_rank} out of {world_size} processors")\n'
var nimSource =
  '# On the Judge0 IDE, Nim is automatically\n# updated every day to the latest stable version.\necho "hello, world"\n'
var pythonForMlSource =
  'import mlxtend\nimport numpy\nimport pandas\nimport scipy\nimport sklearn\n\nprint("hello, world")\n'
var bosqueSource =
  '// On the Judge0 IDE, Bosque (https://github.com/microsoft/BosqueLanguage)\n// is automatically updated every hour to the latest commit on master branch.\n\nnamespace NSMain;\n\nconcept WithName {\n    invariant $name != "";\n\n    field name: String;\n}\n\nconcept Greeting {\n    abstract method sayHello(): String;\n    \n    virtual method sayGoodbye(): String {\n        return "goodbye";\n    }\n}\n\nentity GenericGreeting provides Greeting {\n    const instance: GenericGreeting = GenericGreeting@{};\n\n    override method sayHello(): String {\n        return "hello world";\n    }\n}\n\nentity NamedGreeting provides WithName, Greeting {\n    override method sayHello(): String {\n        return String::concat("hello", " ", this.name);\n    }\n}\n\nentrypoint function main(arg?: String): String {\n    var val = arg ?| "";\n    if (val == "1") {\n        return GenericGreeting@{}.sayHello();\n    }\n    elif (val == "2") {\n        return GenericGreeting::instance.sayHello();\n    }\n    else {\n        return NamedGreeting@{name="bob"}.sayHello();\n    }\n}\n'
var cppTestSource =
  '#include <gtest/gtest.h>\n\nint add(int x, int y) {\n    return x + y;\n}\n\nTEST(AdditionTest, NeutralElement) {\n    EXPECT_EQ(1, add(1, 0));\n    EXPECT_EQ(1, add(0, 1));\n    EXPECT_EQ(0, add(0, 0));\n}\n\nTEST(AdditionTest, CommutativeProperty) {\n    EXPECT_EQ(add(2, 3), add(3, 2));\n}\n\nint main(int argc, char **argv) {\n    ::testing::InitGoogleTest(&argc, argv);\n    return RUN_ALL_TESTS();\n}\n'
var csharpTestSource =
  'using NUnit.Framework;\n\npublic class Calculator\n{\n    public int add(int a, int b)\n    {\n        return a + b;\n    }\n}\n\n[TestFixture]\npublic class Tests\n{\n    private Calculator calculator;\n\n    [SetUp]\n    protected void SetUp()\n    {\n        calculator = new Calculator();\n    }\n\n    [Test]\n    public void NeutralElement()\n    {\n        Assert.AreEqual(1, calculator.add(1, 0));\n        Assert.AreEqual(1, calculator.add(0, 1));\n        Assert.AreEqual(0, calculator.add(0, 0));\n    }\n\n    [Test]\n    public void CommutativeProperty()\n    {\n        Assert.AreEqual(calculator.add(2, 3), calculator.add(3, 2));\n    }\n}\n'
var csssource = '.body'
var sources = {
  45: "section    .text\n    global _start\n\n_start:\n\n    xor  eax, eax\n    lea   edx, [rax+len]\n    mov al, 1\n    mov  esi, msg\n    mov   edi, eax\n    syscall\n\n    xor    edi, edi\n    lea   eax, [rdi+60]\n    syscall\n\nsection   .rodata\n\nmsg  db 'hello, world', 0xa\nlen equ $ - msg\n",
  46: 'echo "hello, world"',
  47: 'PRINT "hello, world"',
  48: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  49: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  50: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  51: 'public class Hello {\n    public static void Main() {\n        System.Console.WriteLine("hello, world");\n    }\n}\n',
  52: '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n',
  53: '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n',
  54: 'Hello, World!',
  55: '(write-line "hello, world")',
  56: 'import std.stdio;\n\nvoid main()\n{\n    writeln("hello, world");\n}\n',
  57: 'IO.puts "hello, world"',
  58: 'main(_) ->\n    io:fwrite("hello, world\\n").\n',
  44: 'Myth assumes that content of executable is Base64 encoded.\n\nThis means that you should Base64 encode content of your binary,\npaste it here and click "Run".\n\nHere is an example of compiled "hello, world" NASM program.\nContent of compiled binary is Base64 encoded and used as source code.\n\nhttps://ide.judge0.com/?kS_f\n',
  59: 'program main\n    print *, "hello, world"\nend\n',
  60: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("hello, world")\n}\n',
  61: 'main = putStrLn "hello, world"',
  62: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello, world");\n    }\n}\n',
  63: 'console.log("hello, world");',
  64: 'print("mythcoder, is insane")',
  65: 'print_endline "mythcoder, is insane"',
  66: 'printf("hello, world\\n");',
  67: "program Hello;\nbegin\n    writeln ('hello, world')\nend.\n",
  68: '<?php\nprint("hello, world\\n");\n?>\n',
  43: 'mythcoder, is insane\n',
  69: ":- initialization(main).\nmain :- write('mythcoder, is insane\\n').\n",
  70: 'print("hello, world")',
  71: 'print("hello, world")',
  72: 'puts "hello, world"',
  73: 'fn main() {\n    println!("hello, world");\n}\n',
  74: 'console.log("mythcoder, is insane");',
  75: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  76: '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n',
  77: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. MAIN.\nPROCEDURE DIVISION.\nDISPLAY "hello, world".\nSTOP RUN.\n',
  78: 'fun main() {\n    println("mythcoder, is insane")\n}\n',
  79: '#import <Foundation/Foundation.h>\n\nint main() {\n    @autoreleasepool {\n        char name[10];\n        scanf("%s", name);\n        NSString *message = [NSString stringWithFormat:@"hello, %s\\n", name];\n        printf("%s", message.UTF8String);\n    }\n    return 0;\n}\n',
  80: 'cat("hello, world\\n")',
  81: 'object Main {\n    def main(args: Array[String]) = {\n        val name = scala.io.StdIn.readLine()\n        println("hello, "+ name)\n    }\n}\n',
  82: '-- On Judge0 IDE your SQL script is run on chinook database (https://www.sqlitetutorial.net/sqlite-sample-database).\n-- For more information about how to use SQL with Judge0 API please\n-- watch this asciicast: https://asciinema.org/a/326975.\nSELECT\n    Name, COUNT(*) AS num_albums\nFROM artists JOIN albums\nON albums.ArtistID = artists.ArtistID\nGROUP BY Name\nORDER BY num_albums DESC\nLIMIT 4;\n',
  83: 'import Foundation\nlet name = readLine()\nprint("hello, \\(mythcoder!)")\n',
  84: '<html>\n   <head>\n      <title></title>\n   </head>\n <body>\n  </body>\n  </html>\n',
  85: 'my $name = <STDIN>;\nprint "hello, $name";\n',
  86: '(println "hello, world")\n',
  87: 'printfn "hello, world"\n',
  88: 'println "hello, world"\n',
  1001: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  1002: '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n',
  1003: '// On the Myth IDE, C3 is automatically\n// updated every hour to the latest commit on master branch.\nmodule main;\n\nextern func void printf(char *str, ...);\n\nfunc int main()\n{\n    printf("hello, world\\n");\n    return 0;\n}\n',
  1004: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello, world");\n    }\n}\n',
  1005: 'import static org.junit.jupiter.api.Assertions.assertEquals;\n\nimport org.junit.jupiter.api.Test;\n\nclass MainTest {\n    static class Calculator {\n        public int add(int x, int y) {\n            return x + y;\n        }\n    }\n\n    private final Calculator calculator = new Calculator();\n\n    @Test\n    void addition() {\n        assertEquals(2, calculator.add(1, 1));\n    }\n}\n',
  1006: '// Try adding "-n 5" (without quotes) into command line arguments. \n#include <mpi.h>\n\n#include <stdio.h>\n\nint main()\n{\n    MPI_Init(NULL, NULL);\n\n    int world_size;\n    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\n    int world_rank;\n    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\n    printf("Hello from processor with rank %d out of %d processors.\\n", world_rank, world_size);\n\n    MPI_Finalize();\n\n    return 0;\n}\n',
  1007: '// Try adding "-n 5" (without quotes) into command line arguments. \n#include <mpi.h>\n\n#include <iostream>\n\nint main()\n{\n    MPI_Init(NULL, NULL);\n\n    int world_size;\n    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\n    int world_rank;\n    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\n    std::cout << "Hello from processor with rank "\n              << world_rank << " out of " << world_size << " processors.\\n";\n\n    MPI_Finalize();\n\n    return 0;\n}\n',
  1008: '# Try adding "-n 5" (without quotes) into command line arguments. \nfrom mpi4py import MPI\n\ncomm = MPI.COMM_WORLD\nworld_size = comm.Get_size()\nworld_rank = comm.Get_rank()\n\nprint(f"Hello from processor with rank {world_rank} out of {world_size} processors")\n',
  1009: '# On the Judge0 IDE, Nim is automatically\n# updated every day to the latest stable version.\necho "hello, world"\n',
  1010: 'import mlxtend\nimport numpy\nimport pandas\nimport scipy\nimport sklearn\n\nprint("hello, world")\n',
  1011: '// On the Judge0 IDE, Bosque (https://github.com/microsoft/BosqueLanguage)\n// is automatically updated every hour to the latest commit on master branch.\n\nnamespace NSMain;\n\nconcept WithName {\n    invariant $name != "";\n\n    field name: String;\n}\n\nconcept Greeting {\n    abstract method sayHello(): String;\n    \n    virtual method sayGoodbye(): String {\n        return "goodbye";\n    }\n}\n\nentity GenericGreeting provides Greeting {\n    const instance: GenericGreeting = GenericGreeting@{};\n\n    override method sayHello(): String {\n        return "hello world";\n    }\n}\n\nentity NamedGreeting provides WithName, Greeting {\n    override method sayHello(): String {\n        return String::concat("hello", " ", this.name);\n    }\n}\n\nentrypoint function main(arg?: String): String {\n    var val = arg ?| "";\n    if (val == "1") {\n        return GenericGreeting@{}.sayHello();\n    }\n    elif (val == "2") {\n        return GenericGreeting::instance.sayHello();\n    }\n    else {\n        return NamedGreeting@{name="bob"}.sayHello();\n    }\n}\n',
  1012: '#include <gtest/gtest.h>\n\nint add(int x, int y) {\n    return x + y;\n}\n\nTEST(AdditionTest, NeutralElement) {\n    EXPECT_EQ(1, add(1, 0));\n    EXPECT_EQ(1, add(0, 1));\n    EXPECT_EQ(0, add(0, 0));\n}\n\nTEST(AdditionTest, CommutativeProperty) {\n    EXPECT_EQ(add(2, 3), add(3, 2));\n}\n\nint main(int argc, char **argv) {\n    ::testing::InitGoogleTest(&argc, argv);\n    return RUN_ALL_TESTS();\n}\n',
  1013: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  1014: '#include <iostream>\n\nint main() {\n    std::cout << "hello, world" << std::endl;\n    return 0;\n}\n',
  1015: '#include <gtest/gtest.h>\n\nint add(int x, int y) {\n    return x + y;\n}\n\nTEST(AdditionTest, NeutralElement) {\n    EXPECT_EQ(1, add(1, 0));\n    EXPECT_EQ(1, add(0, 1));\n    EXPECT_EQ(0, add(0, 0));\n}\n\nTEST(AdditionTest, CommutativeProperty) {\n    EXPECT_EQ(add(2, 3), add(3, 2));\n}\n\nint main(int argc, char **argv) {\n    ::testing::InitGoogleTest(&argc, argv);\n    return RUN_ALL_TESTS();\n}\n',
  1021: 'public class Hello {\n    public static void Main() {\n        System.Console.WriteLine("hello, world");\n    }\n}\n',
  1022: 'public class Hello {\n    public static void Main() {\n        System.Console.WriteLine("hello, world");\n    }\n}\n',
  1023: 'using NUnit.Framework;\n\npublic class Calculator\n{\n    public int add(int a, int b)\n    {\n        return a + b;\n    }\n}\n\n[TestFixture]\npublic class Tests\n{\n    private Calculator calculator;\n\n    [SetUp]\n    protected void SetUp()\n    {\n        calculator = new Calculator();\n    }\n\n    [Test]\n    public void NeutralElement()\n    {\n        Assert.AreEqual(1, calculator.add(1, 0));\n        Assert.AreEqual(1, calculator.add(0, 1));\n        Assert.AreEqual(0, calculator.add(0, 0));\n    }\n\n    [Test]\n    public void CommutativeProperty()\n    {\n        Assert.AreEqual(calculator.add(2, 3), calculator.add(3, 2));\n    }\n}\n',
  1024: 'printfn "hello, world"\n',
  1070: '.body',
  1090: 'console.log("hello, world");',
  1091: 'print("hello, world")',
  1092: 'print("hello, world")',
  1093: 'console.log("hello, world");',
  1094: 'puts "hello, world"',
  1095: 'print("mythcoder, is insane")',
  1096: 'PRINT "hello, world"',
  1097: 'puts "hello, world"',
  1098: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello, world");\n    }\n}\n',
  1099: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  2000: 'print("hello, world")',
  2001: 'mythcoder, is insane\n',
  2002: 'console.log("hello, world");',
  2003: 'console.log("hello, world");',
  2004: 'println "hello, world"\n',
  2005: 'console.log("hello, world");',
  2006: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("hello, world")\n}\n',
  2007: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("hello, world")\n}\n',
  2008: '// Powered by Myth\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello Judge0!\\n");\n    return 0;\n}\n',
  2009: '<?php\nprint("hello, world\\n");\n?>\n',
  2010: 'main(_) ->\n    io:fwrite("hello, world\\n").\n',
  2011: 'print("hello, world")',
  2012: 'console.log("hello, world");',
  2013: 'print("hello, world")',
  2014: 'mythcoder, is insane\n',
  2015: 'public class Hello {\n    public static void Main() {\n        System.Console.WriteLine("hello, world");\n    }\n}\n',
  2016: 'echo("Hello from Blackpard!")'
}
var fileNames = {
  45: 'main.asm',
  46: 'script.sh',
  47: 'main.bas',
  48: 'main.c',
  49: 'main.c',
  50: 'main.c',
  51: 'Main.cs',
  52: 'main.cpp',
  53: 'main.cpp',
  54: 'main.cpp',
  55: 'script.lisp',
  56: 'main.d',
  57: 'script.exs',
  58: 'main.erl',
  44: 'a.out',
  59: 'main.f90',
  60: 'main.go',
  61: 'main.hs',
  62: 'Main.java',
  63: 'script.js',
  64: 'script.lua',
  65: 'main.ml',
  66: 'script.m',
  67: 'main.pas',
  68: 'script.php',
  43: 'text.txt',
  69: 'main.pro',
  70: 'script.py',
  71: 'script.py',
  72: 'script.rb',
  73: 'main.rs',
  74: 'script.ts',
  75: 'main.c',
  76: 'main.cpp',
  77: 'main.cob',
  78: 'Main.kt',
  79: 'main.m',
  80: 'script.r',
  81: 'Main.scala',
  82: 'script.sql',
  83: 'Main.swift',
  84: 'index.html',
  85: 'script.pl',
  86: 'main.clj',
  87: 'script.fsx',
  88: 'script.groovy',
  1001: 'main.c',
  1002: 'main.cpp',
  1003: 'main.c3',
  1004: 'Main.java',
  1005: 'MainTest.java',
  1006: 'main.c',
  1007: 'main.cpp',
  1008: 'script.py',
  1009: 'main.nim',
  1010: 'script.py',
  1011: 'main.bsq',
  1012: 'main.cpp',
  1013: 'main.c',
  1014: 'main.cpp',
  1015: 'main.cpp',
  1021: 'Main.cs',
  1022: 'Main.cs',
  1023: 'Test.cs',
  1024: 'script.fsx',
  1070: 'style.css',
  1090: 'main.js',
  1091: 'main.boo',
  1092: 'main.dart',
  1093: 'main.coffee',
  1094: 'main.cr',
  1095: 'main.lua',
  1096: 'main.ex',
  1097: 'main.sl',
  1098: 'main.zs',
  1099: 'script.volt',
  2000: 'script.vy',
  2001: 'manifest.json',
  2002: 'script.jade',
  2003: 'script.jade',
  2004: 'script.groovy',
  2005: 'main.ts',
  2006: 'main.go',
  2007: 'main.ls',
  2008: 'main.fx',
  2009: 'main.hack',
  2010: 'main.gleam',
  2011: 'main.gd',
  2012: 'script.fan',
  2013: 'script.pyx',
  2014: 'style.xml',
  2015: 'script.razor',
  2016: 'main.blpd',
}
var languageIdTable = {
  1001: 1,
  1002: 2,
  1003: 3,
  1004: 4,
  1005: 5,
  1006: 6,
  1007: 7,
  1008: 8,
  1009: 9,
  1010: 10,
  1011: 11,
  1012: 12,
  1013: 13,
  1014: 14,
  1015: 15,
  1021: 21,
  1022: 22,
  1023: 23,
  1024: 24,
}
var extraApiUrl = 'https://extra-ce.judge0.com'
var languageApiUrlTable = {
  1001: 'https://extra-ce.judge0.com',
  1002: 'https://extra-ce.judge0.com',
  1003: 'https://extra-ce.judge0.com',
  1004: 'https://extra-ce.judge0.com',
  1005: 'https://extra-ce.judge0.com',
  1006: 'https://extra-ce.judge0.com',
  1007: 'https://extra-ce.judge0.com',
  1008: 'https://extra-ce.judge0.com',
  1009: 'https://extra-ce.judge0.com',
  1010: 'https://extra-ce.judge0.com',
  1011: 'https://extra-ce.judge0.com',
  1012: 'https://extra-ce.judge0.com',
  1013: 'https://extra-ce.judge0.com',
  1014: 'https://extra-ce.judge0.com',
  1015: 'https://extra-ce.judge0.com',
  1021: 'https://extra-ce.judge0.com',
  1022: 'https://extra-ce.judge0.com',
  1023: 'https://extra-ce.judge0.com',
  1024: 'https://extra-ce.judge0.com',
}
var competitiveProgrammingInput =
  '3\n3 2\n1 2 5\n2 3 7\n1 3\n3 3\n1 2 4\n1 3 7\n2 3 1\n1 3\n3 1\n1 2 4\n1 3\n'
var inputs = {
  54: '3\n3 2\n1 2 5\n2 3 7\n1 3\n3 3\n1 2 4\n1 3 7\n2 3 1\n1 3\n3 1\n1 2 4\n1 3\n',
}
var competitiveProgrammingCompilerOptions =
  '-O3 --std=c++17 -Wall -Wextra -Wold-style-cast -Wuseless-cast -Wnull-dereference -Werror -Wfatal-errors -pedantic -pedantic-errors'
var compilerOptions = {
  54: '-O3 --std=c++17 -Wall -Wextra -Wold-style-cast -Wuseless-cast -Wnull-dereference -Werror -Wfatal-errors -pedantic -pedantic-errors',
}
