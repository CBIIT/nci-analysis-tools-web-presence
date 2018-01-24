import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.html2pdf.attach.ITagWorker;
import com.itextpdf.html2pdf.attach.ProcessorContext;
import com.itextpdf.html2pdf.attach.impl.DefaultTagWorkerFactory;
import com.itextpdf.html2pdf.attach.impl.tags.DivTagWorker;
import com.itextpdf.html2pdf.html.node.IElementNode;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.kernel.pdf.canvas.CanvasTag;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.IPropertyContainer;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.property.AreaBreakType;
import com.itextpdf.layout.property.TextAlignment;
import org.apache.commons.cli.*;

import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class App {

    public static void main(String[] args) throws Exception {

        // use default values for input/output/config files
        List<File> inputFiles = new ArrayList<File>();
        File outputFile = new File("output.pdf");
        String title = "";
        String header = "";
        String footer = "";
        boolean includePageNumbers = false;

        try {
            CommandLine cmd = new DefaultParser().parse(getOptions(), args);

            if (cmd.hasOption("input")) {
                for (String fileName : cmd.getOptionValue("input").split(":")) {
                    File inputFile = new File(fileName);
                    if (inputFile.exists()) {
                        inputFiles.add(inputFile);
                    }
                }
            }

            if (cmd.hasOption("output")) {
                outputFile = new File(cmd.getOptionValue("output"));
            }

            if (cmd.hasOption("title")) {
                title = cmd.getOptionValue("title");
            }

            if (cmd.hasOption("header")) {
                header = cmd.getOptionValue("header");
            }

            if (cmd.hasOption("footer")) {
                footer = cmd.getOptionValue("footer");
            }

            if (cmd.hasOption("numbered")) {
                includePageNumbers = true;
            }
        }

        catch (ParseException e) {
            printUsage("java -jar html2pdf.jar", getOptions());
            return;
        }

        if (inputFiles.isEmpty()) {
            File inputFile = new File("input.html");
            if (inputFile.exists()) {
                inputFiles.add(inputFile);
            }
            else {
                printUsage("java -jar html2pdf.jar", getOptions());
                return;
            }
        }

        html2pdf(inputFiles, outputFile, title, header, footer, includePageNumbers);
    }

    /**
     * Prints the usage for a set of Options
     * @param options The options for which to display the usage
     */
    public static void printUsage(String header, Options options) {
        HelpFormatter helpFormatter = new HelpFormatter();
        helpFormatter.setOptionComparator(null);
        helpFormatter.printHelp(header + "\n\n", options);
    }

    /**
     * @return Options for the cli parser
     */
    public static Options getOptions() {
        return new Options()
            .addOption("i", "input", true, "Specify input .html filenames, separated by `:` (default: input.html)")
            .addOption("o", "output", true, "Specify the output .pdf filename (default: output.pdf)")
            .addOption("t", "title", true, "Specify a string use as the title for the pdf.")
            .addOption("h", "header", true, "Specify a string use as the header for each page. The header will be right-aligned.")
            .addOption("f", "footer", true, "Specify a string to use as the footer for each page. The footer will be right-aligned.")
            .addOption("n", "numbered", false, "Add page numbers to the output (format: Page x of y)");
    }

    /**
     * Generates a pdf from a list of html files
     * @param inputFiles Source files
     * @param outputFile Destination file
     * @param title Title text
     * @param header Header text
     * @param header Footer text
     * @param includePageNumbers Flag to include page numbers
     * @throws IOException
     */
    public static void html2pdf(List<File> inputFiles, File outputFile, String title, String header, String footer, boolean includePageNumbers) throws IOException {

        PdfWriter writer = new PdfWriter(outputFile.getCanonicalPath(), new WriterProperties().addXmpMetadata().addUAXmpMetadata());
        PdfDocument pdf = new PdfDocument(writer);

        Document document = new Document(pdf, PageSize.LETTER, false);

        HeaderFooterHandler eventHandler = new HeaderFooterHandler(header, footer, includePageNumbers);
        pdf.addEventHandler(PdfDocumentEvent.START_PAGE, eventHandler);

        pdf.setTagged();

        pdf.getCatalog().setLang(new PdfString("en-US"));
        pdf.getCatalog().setViewerPreferences(new PdfViewerPreferences().setDisplayDocTitle(true));

        PdfDocumentInfo info = pdf.getDocumentInfo();
        info.setTitle(title);

        ConverterProperties properties = new ConverterProperties()
                .setBaseUri(inputFiles.get(0).getParent());
//                .setCreateAcroForm(true);


        // <hr> elements will start a new page
        properties.setTagWorkerFactory(
                new DefaultTagWorkerFactory() {
                    @Override
                    public ITagWorker getCustomTagWorker(
                            IElementNode tag,
                            ProcessorContext context) {

                        if ("hr".equalsIgnoreCase(tag.name()) ) {
                            return new DivTagWorker(tag, context) {
                                @Override
                                public IPropertyContainer getElementResult() {
                                    return new Div()
                                        .add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                                }
                            };
                        }
                        return null;
                    }
                } );


        // merge input files into one output file
        for (int i = 0; i < inputFiles.size(); i ++) {
            File inputFile = inputFiles.get(i);

            // convert input file to a list of elements
            InputStream inputStream = new FileInputStream(inputFile);
            List<IElement> elements = HtmlConverter.convertToElements(inputStream, properties);

            // add each element to the document
            for (IElement element : elements) {
                document.add((IBlockElement)element);
            }

            // add page break if not on last page
            if (i < inputFiles.size() - 1) {
                document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }
        }

        if (includePageNumbers) {
            eventHandler.writeTotal(pdf);
        }

        document.close();
    }
}

class HeaderFooterHandler implements IEventHandler {
    private PdfFormXObject placeholder;
    private float side = 20;
    private float space = 3;
    private float descent = 3;

    private String headerText = "";
    private String footerText = "";
    private boolean includePageNumbers = false;
    private PdfFont font;

    public HeaderFooterHandler (String headerText, String footerText, boolean includePageNumbers) {
        this.headerText = headerText;
        this.footerText = footerText;
        this.includePageNumbers = includePageNumbers;
        this.placeholder = new PdfFormXObject(new Rectangle(0, 0, side, side));

        try {
            this.font = PdfFontFactory.createFont("com/itextpdf/html2pdf/font/FreeSerif.ttf", PdfEncodings.IDENTITY_H, true);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleEvent(Event event) {
        PdfDocumentEvent docEvent = (PdfDocumentEvent) event;

        PdfPage page = docEvent.getPage();
        Rectangle pageSize = page.getPageSize();
        PdfDocument pdfDoc = ((PdfDocumentEvent) event).getDocument();

        PdfCanvas pdfCanvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc)
                .setFontAndSize(font, 12)
                .beginMarkedContent(PdfName.Artifact);

        Canvas canvas = new Canvas(pdfCanvas, pdfDoc, pageSize)
                .setFont(font)
                .showTextAligned(headerText, pageSize.getWidth() - 40, pageSize.getTop() - 30, TextAlignment.RIGHT)
                .showTextAligned(footerText, pageSize.getWidth() - 40, 30, TextAlignment.RIGHT);

        if (includePageNumbers) {
            String text = "Page " + pdfDoc.getPageNumber(page) + " of ";
            float width = font.getWidth(text, 12);

            canvas.showTextAligned(text, (pageSize.getWidth() - side) / 2, 30, TextAlignment.CENTER);
            pdfCanvas.addXObject(placeholder, (pageSize.getWidth() + width - side) / 2 + space, 30 - descent);
        }

        pdfCanvas
                .endMarkedContent()
                .release();
    }

    public void writeTotal(PdfDocument pdf) {
        new Canvas(placeholder, pdf)
            .setFont(font)
            .showTextAligned(
                 String.valueOf(pdf.getNumberOfPages()),
                0,
                descent,
                TextAlignment.LEFT);
    }
}