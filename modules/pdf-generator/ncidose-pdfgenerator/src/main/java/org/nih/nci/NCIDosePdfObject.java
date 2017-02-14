package org.nih.nci;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Created by yankovsr on 1/30/2017.
 */
public class NCIDosePdfObject {
    private String first;
    private String last;
    private String title;
    private String email;
    private String phone;
    private String institution;
    private String purpose;
    @SerializedName("software_text")
    private List<String> softwareText;
    private String address;
    private String date;

    public String getFirst() {
        return first;
    }

    public void setFirst(String first) {
        this.first = first;
    }

    public String getLast() {
        return last;
    }

    public void setLast(String last) {
        this.last = last;
    }
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public List<String> getSoftwareText() {
        return softwareText;
    }

    public void setSoftwareText(List<String> softwareText) {
        this.softwareText = softwareText;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
