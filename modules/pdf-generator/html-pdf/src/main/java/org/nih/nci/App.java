package org.nih.nci;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Created by yankovsr on 2/8/2017.
 */
public class App {

    public static void main(String args[]) {

        String html, dest, css;

        if (args.length != 3) {
            usage();
        } else {

            try {
                html = args[0];
                dest = args[1];
                css = args[2];

                App app = new App();
                app.generatePdf(html, dest, css);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    protected void generatePdf(String html, String dest, String css) {

        Path fileToDeletePath = Paths.get(dest);
        try {
            Files.deleteIfExists(fileToDeletePath);
        } catch (IOException e) {
            e.printStackTrace();
        }

        System.out.println("Hello World.");

        Document document = new Document(PageSize.LETTER.rotate());

        PdfWriter writer;
        try {
            writer = PdfWriter.getInstance(document, new FileOutputStream(dest));

            writer.setPdfVersion(PdfWriter.VERSION_1_7);

            writer.setTagged();
            writer.setViewerPreferences(PdfWriter.DisplayDocTitle);

            document.addLanguage("en-US");
            document.addTitle("HTML to PDF");

            writer.createXmpMetadata();

            document.open();

            XMLWorkerHelper.getInstance().parseXHtml(writer, document,
                    new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8)), new FileInputStream(css));

            document.close();

        } catch (DocumentException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException ioe) {
            ioe.printStackTrace();
        }

    }

    private static void usage() {
        System.err.println("Usage: java " + App.class.getName() + " <html-string> <output-location> <css-location>");
    }

}
