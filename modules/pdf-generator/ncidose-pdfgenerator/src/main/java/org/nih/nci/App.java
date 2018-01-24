package org.nih.nci;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;
import com.itextpdf.io.font.FontConstants;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.Style;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.property.AreaBreakType;
import com.itextpdf.layout.property.ListNumberingType;
import com.itextpdf.layout.property.TextAlignment;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.BasicConfigurator;

import javax.xml.transform.TransformerException;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;


/**
 * Hello world!
 */
public class App {

    public static void main(String[] args) throws IOException, TransformerException

    {
        BasicConfigurator.configure();
        if (args.length != 2) {
            usage();
        } else {

            try {
                App app = new App();
                NCIDosePdfObject jObject = app.parseJson(args[1]);
                app.generatePdf(args[0], jObject);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    protected NCIDosePdfObject parseJson(String json) throws FileNotFoundException {
        Gson gson = new Gson();
        JsonReader reader = new JsonReader(new FileReader(json));

        NCIDosePdfObject data = gson.fromJson(reader, NCIDosePdfObject.class);

        return data;
      }

    protected void generatePdf(String dest, NCIDosePdfObject jObject) throws Exception {

        PdfWriter writer = new PdfWriter(dest, new WriterProperties().addXmpMetadata());
        PdfDocument pdfDoc = new PdfDocument(writer);

        pdfDoc.setTagged();
        pdfDoc.getCatalog().setViewerPreferences(new PdfViewerPreferences().setDisplayDocTitle(true));
        pdfDoc.getCatalog().setLang(new PdfString("en-US"));
        pdfDoc.getCatalog().setViewerPreferences(
                new PdfViewerPreferences().setDisplayDocTitle(true));
        PdfDocumentInfo info = pdfDoc.getDocumentInfo();
        info.setTitle("Software Transfer Agreement");

        Style headerStyle = new Style();
        PdfFont headerFont = PdfFontFactory.createFont(FontConstants.HELVETICA);
        headerStyle.setFont(headerFont).setFontSize(10);

        HeaderEventHandler handler = new HeaderEventHandler();
        pdfDoc.addEventHandler(PdfDocumentEvent.END_PAGE, handler);
        handler.setHeader("NCI Reference # ___________________");

        Style titleStyle = new Style();
        PdfFont titleFont = PdfFontFactory.createFont(FontConstants.TIMES_BOLD, true);
        titleStyle.setFont(titleFont).setFontSize(14);

        Style normalStyle = new Style();
        PdfFont normalFont = PdfFontFactory.createFont(FontConstants.TIMES_ROMAN, true);
        normalStyle.setFont(normalFont).setFontSize(12);

        Style italicStyle = new Style();
        PdfFont italicFont = PdfFontFactory.createFont(FontConstants.TIMES_ITALIC, true);
        italicStyle.setFont(italicFont).setFontSize(12);

        InputStream istream = getClass().getResourceAsStream("/FreeSerif.ttf");
        byte[] bytes = IOUtils.toByteArray(istream);
        PdfFont symbol = PdfFontFactory.createFont(bytes, PdfEncodings.IDENTITY_H, true);

        Text checkbox = new Text("\u2611")
            .setFont(symbol)
            .setFontSize(12);

        Document document = new Document(pdfDoc, PageSize.LETTER, false)
            .add(new Paragraph()
                .setMarginTop(20)
                .setTextAlignment(TextAlignment.CENTER)
                .add(new Text("SOFTWARE TRANSFER AGREEMENT")
                    .addStyle(titleStyle)))

            .add(new Paragraph()
                .setMarginLeft(56f)
                .add(new Text("Provider: National Cancer Institute (NCI)")
                    .addStyle(normalStyle)))

            .add(new Paragraph()
                .setMarginLeft(56f)
                .add(new Text("Provider: National Cancer Institute (NCI)")
                    .addStyle(normalStyle)))

            .add(new Paragraph()
                .setMarginLeft(56f)
                .add(new Text(jObject.getInstitution())
                    .addStyle(italicStyle)
                    .setUnderline()))

            .add(new Paragraph()
                .setMarginLeft(28f)
                .add(new Text("WHEREAS, Provider has certain proprietary software and associated material described "
                    + "below (hereinafter, collectively referred to as Software)")
                    .addStyle(normalStyle))
                .add(new Text("[Describe all items being transferred such as; software, executable code, source code, "
                    + "documentation, data and all other associated materials]")
                    .addStyle(italicStyle))
                .add(new Text(":")
                    .addStyle(normalStyle)));

        // add descriptions of software components
        for (String str : jObject.getSoftwareText())
            document.add(new Paragraph()
                .setMarginLeft(56f)
                .add(checkbox)
                .add(new Text(str)
                    .addStyle(normalStyle)
                    .setBold()));

        document
            .add(new Paragraph()
                .setMarginLeft(28f)
                .add(new Text("Provider agrees to transfer such Software to Recipient Investigator, to be used solely "
                    + "in connection with the following research activity and for the following reasons (hereinafter "
                    + "Project)")
                    .addStyle(normalStyle))
                .add(new Text("[Describe with specificity the scope of use of Software under this agreement]")
                    .addStyle(italicStyle))
                .add(new Text(":")
                    .addStyle(normalStyle)))

            .add(new Paragraph()
                .setMarginLeft(56f)
                .add(new Text(jObject.getPurpose())
                    .addStyle(italicStyle)
                    .setUnderline()))

            .add(new Paragraph()
                .setMarginLeft(28f)
                .add(new Text("NOW, THEREFORE, in consideration of the premises and mutual covenants contained "
                    + "herein, the Provider and Recipient agree as follows:")
                    .addStyle(normalStyle)))

            .add(new List()
                .setListSymbol("")

            )
        ;

        List numberedList = new List(ListNumberingType.DECIMAL)
            .setMarginLeft(56f)
            .addStyle(normalStyle)
            .add("SOFTWARE SHALL NOT BE USED FOR TREATING OR DIAGNOSING " +
                    "HUMAN SUBJECTS.")
            .add("Recipient will not license or sell or use Software for commercial purposes or " +
                "applications. Recipient Investigator shall retain control over Software and further " +
                "will not transfer the Software to individuals not under Recipient Investigator’s " +
                "direct supervision without the advance written approval of Provider. Recipient " +
                "agrees to comply with all regulations applicable to the Project and the use of the " +
                "Software.")
            .add("Recipient agrees not to copy Software, in whole or in part, except as required for " +
                "use by Recipient Investigator for the conduct of the Project. Recipient shall not " +
                "modify, extend, decompile, make derivatives of or reverse engineer the Software " +
                "without written permission from Provider.")
            .add("Information deemed confidential under this Agreement (“Confidential Information”) " +
                "shall be clearly marked “CONFIDENTIAL.” Any information that is orally " +
                "disclosed must be reduced to writing and marked “CONFIDENTIAL” by the " +
                "provider of the information within thirty (30) days of such disclosure. To the extent " +
                "permitted by applicable law, the Recipient agrees to employ all reasonable efforts to " +
                "safeguard Provider’s Confidential Information to ensure that no unauthorized " +
                "person shall have access thereto and that no unauthorized copy, publication, " +
                "disclosure or distribution, in whole or in part, in any form shall be made.")
            .add("In all oral presentations or written publications concerning the Project, Recipient " +
                "will acknowledge Provider’s contribution of Software unless requested otherwise. " +
                "Recipient may publish or otherwise publicly disclose the results of the Project, but " +
                "if Provider has given Confidential Information to Recipient, such public disclosure " +
                "may be made only after Provider has had 30 days to review the proposed disclosure, " +
                "except when a shortened time period under court order or the Freedom of " +
                "Information Act pertains.")
        ;

        List subList = new List(ListNumberingType.ENGLISH_LOWER)
            .addStyle(normalStyle)
            .setMarginLeft(84f)
            .add("that can be demonstrated to have been publicly known at the time of " +
                "disclosure; or")
            .add("that can be demonstrated to have been properly in the Recipient’s " +
                "possession or that can be demonstrated to have been readily available to the " +
                "Recipient from another proper source prior to the disclosure; or")
            .add("that becomes part of the public domain or publicly known by publication or " +
                "otherwise, not due to any unauthorized act by the Recipient or its " +
                "subsidiaries; or")
            .add("that can be demonstrated as independently developed or acquired by the " +
                "Recipient without reference to or reliance upon such information; or")
            .add("that is required to be disclosed by law, provided that the Recipient takes " +
                "reasonable and lawful actions to avoid and/or minimize such disclosure.");

        List mainList = new List();
        mainList.setListSymbol("");

        ListItem item1 = new ListItem();
        item1.add(numberedList);
        mainList.add(item1);

        ListItem item2 = new ListItem();
        item2.add(subList);
        mainList.add(item2);

        numberedList = new List(ListNumberingType.DECIMAL);
        numberedList.setMarginLeft(56f);
        numberedList.addStyle(normalStyle);
        numberedList.setItemStartIndex(7);

        numberedList.add("The Recipient’s obligations under Paragraphs 4 and 5 shall extend for a period of " +
                "three (3) years from the date of disclosure.");

        numberedList.add("Title in the Software shall remain with the Provider. It is understood that nothing " +
                "herein shall be deemed to constitute, by implication or otherwise, the grant to either " +
                "Party by the other of any license or other rights under any patent, patent application " +
                "or other intellectual property right or interest. Provider reserves the right to " +
                "distribute Software to others and to use it for Provider’s own purposes.");

        numberedList.add("When the Project is completed or this Agreement is terminated, whichever occurs " +
                "first, Recipient will destroy all copies of Software and Provider’s Confidential " +
                "Information unless directed otherwise by Provider in writing.");

        numberedList.add("This Agreement may be terminated by either Recipient or Provider by providing 30 " +
                "days advance notice.");

        numberedList.add("The Provider and Recipient each shall retain title to any patent or other intellectual " +
                "property of their respective employees developed or created in the course of the " +
                "Project defined in this Agreement. Neither Provider nor Recipient promise rights in " +
                "advance for inventions developed under this Agreement.");

        numberedList.add("No indemnification for any loss, claim, damage, or liability is intended or provided " +
                "by any party under this Agreement. Each party shall be liable for any loss, claim, " +
                "damage, or liability that said party incurs as a result of said party’s activities under " +
                "this Agreement, except that the NIH, as an agency of the United States, assumes " +
                "liability only to the extent as provided under the United States Federal Tort Claims " +
                "Act (28 U.S.C. Chapter 171).");

        numberedList.add("Software is supplied AS IS, without any accompanying services or improvements\n" +
                "from Provider. SOFTWARE IS SUPPLIED TO RECIPIENT WITH NO\n" +
                "WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY WARRANTY OF\n" +
                "MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Provider\n" +
                "makes no representations that the use of Software will not infringe any patent or\n" +
                "proprietary rights of third parties.");

        ListItem item3 = new ListItem();
        item3.add(numberedList);
        mainList.add(item3);

        document.add(mainList);

        p = new Paragraph();
        p.setMarginTop(20);
        p.setTextAlignment(TextAlignment.CENTER);
        text = new Text("Signatures Begin on Next Page").addStyle(titleStyle).setFontSize(12);
        p.add(text);
        document.add(p);
        document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        p = new Paragraph();
        p.setMarginTop(20f);
        p.setMarginLeft(28f);
        text = new Text("For Recipient:").addStyle(titleStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p
                .add(new Text("Authorized Official").setBold().addStyle(italicStyle))
                .add(new Text(" for Recipient:")).addStyle(italicStyle);
        document.add(p);

        p = new Paragraph();
        p.setMarginTop(10);
        p.setMarginLeft(28f);
        text = new Text("Name: ______________________________________ Job Title: _____________________\n").addStyle(normalStyle);
        p.add(text);
        text = new Text("Signature: ______________________________________  Date: _____________________").addStyle(normalStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        text = new Text("Read and Understood by ").addStyle(italicStyle);
        p.add(text).add(new Text("Recipient Investigator:").setBold().addStyle(italicStyle));
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        p.add(new Text("Name: ").addStyle(normalStyle))
                .add(new Text(jObject.getFirst()).addStyle(italicStyle))
                .add(new Text(" "))
                .add(new Text(jObject.getLast()).addStyle(italicStyle))
                .add(new Tab()).add(new Text("Job Title: ").addStyle(normalStyle))
                .add(new Text(jObject.getTitle()).addStyle(italicStyle)).add(new Text("\n"));
        text = new Text("Signature: ____________________________________  Date: _____________________").addStyle(normalStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        p
                .add(new Text("Recipient’s ").addStyle(italicStyle))
                .add(new Text("Mailing Address ").setBold().addStyle(italicStyle))
                .add(new Text("for Legal Notices:").addStyle(italicStyle));
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        text = new Text(jObject.getAddress()).addStyle(italicStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        p.add(new Text("Email: ").addStyle(normalStyle)).add(new Text(jObject .getEmail()).addStyle(italicStyle)).add(new Tab()).add(new Text ("Phone: ").addStyle(normalStyle)).add(new Text(jObject.getPhone()).addStyle(italicStyle));

        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(20);
        text = new Text("For Provider:").addStyle(titleStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p
                .add(new Text("Authorized Official").setBold().addStyle(italicStyle))
                .add(new Text(" for Provider:")).addStyle(italicStyle);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        text = new Text("Name: ______________________________________ Job Title: _____________________\n").addStyle(normalStyle);
        p.add(text);
        text = new Text("Signature: ______________________________________  Date: _____________________").addStyle(normalStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        text = new Text("Read and Understood by ").addStyle(italicStyle);
        p.add(text).add(new Text("Provider’s Investigator:").setBold().addStyle(italicStyle));
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        p.setMarginTop(10);
        text = new Text(
                "Choonsik Lee, PhD\n" +
                "Senior Investigator\n" +
                "Radiation Epidemiology Branch\n" +
                "Division of Cancer Epidemiology & Genetics, NCI, NIH\n" +
                "Signature: ______________________________________  Date: _____________________\n"
        ).addStyle(normalStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(28f);
        text = new Text("Provider’s Mailing Address for Legal Notices:").addStyle(normalStyle);
        p.add(text);
        document.add(p);

        p = new Paragraph();
        p.setMarginLeft(56f);
        text = new Text("National Institutes of Health\n" +
                "National Cancer Institute\n" +
                "Technology Transfer Center\n" +
                "9609 Medical Center Dr. Rm 1E530, MSC 9702 Bethesda, MD 20892-9702\n" +
                "Phone: 240-276-5530 Fax: 240-276-5504").addStyle(normalStyle);
        p.add(text);
        document.add(p);


        addPageNumbers(pdfDoc);
        document.close();

    }

    protected class HeaderEventHandler implements IEventHandler {
        protected String header;

        public void setHeader(String header) {
            this.header = header;
        }

        public void handleEvent(Event event) {
            PdfDocumentEvent documentEvent = (PdfDocumentEvent) event;

            try {
                new PdfCanvas(documentEvent.getPage())
                        .beginText()
                        .setFontAndSize(PdfFontFactory.createFont(FontConstants.HELVETICA), 10)
                        .beginMarkedContent(PdfName.Artifact)
                        .moveText(380, 760)
                        .showText(header)
                        .endText()
                        .stroke()
                        .endMarkedContent();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    protected void addPageNumbers(PdfDocument pdfDocument) {

        int numPages = pdfDocument.getNumberOfPages();

        for (int i = 1; i <= numPages; i++) {
            PdfPage page = pdfDocument.getPage(i);
            page.put(new PdfName("Tabs"), PdfName.S);
            try {
                new PdfCanvas(page)
                        .beginText()
                        .setFontAndSize(PdfFontFactory.createFont(FontConstants.HELVETICA), 10)
                        .beginMarkedContent(PdfName.Artifact)
                        .moveText(255, 25)
                        .showText("Page " + i + " of " + numPages)
                        .endText()
                        .stroke()
                        .endMarkedContent();
            }  catch (IOException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private static void usage() {
        System.err.println("Usage: java " + App.class.getName() + " <output-pdf> <json-location>");
    }
}
