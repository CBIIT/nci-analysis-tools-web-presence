# html2pdf
A command-line wrapper for iText7's pdfHTML library for creating accessible pdfs from html files.

## Usage
```bash
java -jar html2pdf.jar 
 -i,--input <arg>    Specify input .html filenames, separated by `:` (default: input.html)
 -o,--output <arg>   Specify the output .pdf filename (default: output.pdf)
 -h,--header <arg>   Specify a string use as the header for each page. The header will be right-aligned.
 -f,--footer <arg>   Specify a string to use as the footer for each page. The footer will be right-aligned.
 -n,--numbered       Add page numbers to the output (format: Page x of y). This will override any footers specified.
```
