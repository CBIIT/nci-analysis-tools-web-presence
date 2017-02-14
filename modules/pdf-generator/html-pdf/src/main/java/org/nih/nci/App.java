package org.nih.nci;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
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

        Rectangle rectangle = new Rectangle(900, 595);
        Document document = new Document(rectangle, 54, 54, 54, 36);

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

            XMLWorkerHelper.getInstance().parseXHtml(writer, document, new FileInputStream(html), new FileInputStream(css));

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
        System.err.println("Usage: java " + App.class.getName() + " <html-location> <output-location> <css-location>");
    }

}
